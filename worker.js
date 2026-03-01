/**
 * Cloudflare Worker: minireader
 *
 * GET  /?keyword=...   → dictionary search (multi-API fallback chain)
 * POST /handwrite      → Google Input Tools handwriting proxy
 *
 * Dictionary strategy (in order):
 *  1. jotoba.de  — open-source Japanese dictionary, best results
 *  2. kanjiapi.dev — open, CORS, no blocking; kanji-only but reliable
 *
 * Both responses are normalised to Jisho-compatible JSON so the
 * frontend needs no changes.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // ── Handwriting proxy ──────────────────────────────────────────────────
    if (url.pathname === '/handwrite') {
      if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
      let body;
      try { body = await request.json(); }
      catch (e) { return json({ error: 'BAD_REQUEST_BODY', detail: String(e) }, 400); }

      try {
        const upstream = await fetch(
          'https://www.google.com/inputtools/request?ime=handwriting&app=translate&cs=1',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              'Accept': 'application/json',
              'Origin': 'https://translate.google.com',
              'Referer': 'https://translate.google.com/',
            },
            body: JSON.stringify(body),
          }
        );
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      } catch (e) {
        return json({ error: 'HANDWRITE_FAILED', detail: String(e) }, 502);
      }
    }

    // ── Dictionary proxy ───────────────────────────────────────────────────
    const keyword = url.searchParams.get('keyword') || '';
    if (!keyword) return json({ error: 'Missing keyword' }, 400);

    // 1️⃣ Try Jotoba (best quality, sometimes unreachable from CF)
    try {
      const r = await fetch('https://jotoba.de/api/search/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: keyword, no_english: false, language: 'English' }),
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const jd = await r.json();
        const data = normaliseJotoba(jd.words || []);
        if (data.length) {
          return okJson({ meta: { status: 200, source: 'jotoba' }, data }, ctx);
        }
      }
    } catch (_) { /* fall through */ }

    // 2️⃣ Try kanjiapi.dev — works for any single kanji character
    //    Also works for the first kanji in a multi-char string
    const firstChar = [...keyword][0] || '';
    const isKanji   = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(firstChar);

    if (isKanji) {
      try {
        // /v1/words/{char} — returns word entries containing this kanji
        const r = await fetch(`https://kanjiapi.dev/v1/words/${encodeURIComponent(firstChar)}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(4000),
        });
        if (r.ok) {
          const words = await r.json(); // array of word objects
          const data  = normaliseKanjiapi(words, keyword);
          if (data.length) {
            return okJson({ meta: { status: 200, source: 'kanjiapi' }, data }, ctx);
          }
        }
      } catch (_) { /* fall through */ }

      // Also fetch kanji details for the first char
      try {
        const r = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(firstChar)}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(4000),
        });
        if (r.ok) {
          const k = await r.json();
          const data = normaliseKanjiDetail(k, firstChar);
          return okJson({ meta: { status: 200, source: 'kanjiapi-detail' }, data }, ctx);
        }
      } catch (_) { /* fall through */ }
    }

    // 3️⃣ All APIs failed
    return json({ error: 'DICTIONARY_UNAVAILABLE', detail: 'All upstream APIs failed', data: [] }, 502);
  },
};

// ── Normalise Jotoba → Jisho shape ─────────────────────────────────────────
// Jotoba pos can be any of:
//   string               e.g. "Noun"
//   string[]             e.g. ["Noun", "No-adjective"]   ← nested array
//   {Tag: value}         e.g. {Noun: null}
//   Array of the above   e.g. [{Noun: null}, "Adverb"]
// Flatten everything to a clean string array.
function posToStrings(pos) {
  if (!pos) return [];
  // Recursively flatten one level
  const flatten = (p) => {
    if (typeof p === 'string')  return p ? [p] : [];
    if (Array.isArray(p))       return p.flatMap(flatten);   // handles string[] inside
    if (p && typeof p === 'object') {
      const key = Object.keys(p)[0];
      return key ? [key] : [];
    }
    return [];
  };
  return flatten(pos).filter(Boolean);
}

function normaliseJotoba(words) {
  return words.map(w => ({
    japanese: [{
      word:    w.reading?.kanji || w.reading?.kana || '',
      reading: w.reading?.kana  || '',
    }],
    senses: (w.senses || []).map(s => ({
      english_definitions: s.glosses || [],
      parts_of_speech:     posToStrings(s.pos),
    })),
    jlpt:      w.jlpt_lvl ? [`jlpt-n${w.jlpt_lvl}`] : [],
    is_common: w.common || false,
  }));
}

// ── Normalise kanjiapi /v1/words → Jisho shape ─────────────────────────────
// kanjiapi word entry: { variants: [{written, pronounced}], meanings_in_context: [{meaning, in_compounds, ...}] }
function normaliseKanjiapi(words, query) {
  const out = [];
  for (const w of words) {
    if (!w.variants?.length) continue;

    // Filter: prefer entries whose written form starts with or matches the query
    const variants = w.variants.filter(v =>
      v.written?.includes(query) || query.includes(v.written) || v.written?.startsWith(query)
    );
    const v = variants[0] || w.variants[0];

    const meanings = (w.meanings_in_context || [])
      .flatMap(m => m.meaning ? [m.meaning] : [])
      .slice(0, 4);

    if (!meanings.length) continue;

    out.push({
      japanese: [{
        word:    v.written    || '',
        reading: v.pronounced || '',
      }],
      senses: [{ english_definitions: meanings, parts_of_speech: [] }],
      jlpt:      [],
      is_common: false,
    });

    if (out.length >= 8) break;
  }
  return out;
}

// ── Normalise kanjiapi /v1/kanji → Jisho shape ─────────────────────────────
// Used when a single kanji is searched — gives on/kun readings + meanings
function normaliseKanjiDetail(k, char) {
  const readings = [
    ...(k.kun_readings || []).map(r => r.replace(/\./g, '')),
    ...(k.on_readings  || []).map(r => r),
  ].filter(Boolean).slice(0, 4);

  const meanings = (k.meanings || []).slice(0, 5);

  return readings.length || meanings.length ? [{
    japanese: readings.map(r => ({ word: char, reading: r })).concat(
      readings.length ? [] : [{ word: char, reading: '' }]
    ).slice(0, 1),
    senses: [{ english_definitions: meanings, parts_of_speech: [] }],
    jlpt:      k.jlpt ? [`jlpt-n${k.jlpt}`] : [],
    is_common: false,
  }] : [];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function okJson(obj, ctx) {
  const body = JSON.stringify(obj);
  const resp = new Response(body, {
    status: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  });
  return resp;
}
