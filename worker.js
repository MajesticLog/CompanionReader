/* =============================================================
   Cloudflare Worker — Dictionary + Handwriting proxy
   API chain:
     1. Jotoba.de       (best quality, POST, handles romaji/kana/kanji)
     2. Jotoba retry    (romaji → hiragana conversion, retry same API)
     3. Kanjiapi.dev    (kanji input only, very reliable)
     4. DICTIONARY_UNAVAILABLE
   ============================================================= */

export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';

    // ── CORS preflight ───────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // ── Route: /handwrite ────────────────────────────────────────────────────
    if (url.pathname === '/handwrite') {
      return handleHandwrite(request, origin);
    }

    // ── Route: /?nhk=1  (NHK Easy News article list) ───────────────────────
    if (url.searchParams.has('nhk')) {
      return handleNhkList(origin);
    }

    // ── Route: /?nhk_article=url  (single article body) ────────────────────
    const nhkUrl = url.searchParams.get('nhk_article');
    if (nhkUrl) {
      return handleNhkArticle(nhkUrl, origin);
    }

    // ── Route: /?keyword=... ─────────────────────────────────────────────────
    const keyword = url.searchParams.get('keyword')?.trim() || '';
    if (!keyword) {
      return json({ error: 'MISSING_KEYWORD', data: [] }, 400, origin);
    }

    return handleDictionary(keyword, origin);
  }
};

// ── Route: /sentences?word=枕元 ──────────────────────────────────────────────
// Proxies Tatoeba API for example sentences (CORS-safe)
async function handleSentences(word, origin) {
  try {
    const url = `https://api.tatoeba.org/unstable/sentences?lang=jpn&trans=eng&q=${encodeURIComponent(word)}&limit=3`;
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return json({ error: 'SENTENCES_UNAVAILABLE', data: [] }, 200, origin);
    const d = await r.json();
    // Normalise: [{text, translation}]
    const sentences = (d.data || []).slice(0, 3).map(s => ({
      text: s.text || '',
      translation: s.translations?.[0]?.[0]?.text || '',
    })).filter(s => s.text);
    return json({ data: sentences }, 200, origin);
  } catch (e) {
    return json({ error: 'SENTENCES_FAILED', data: [] }, 200, origin);
  }
}

// ── Route: /wanikani?token=xxx&word=枕元 ────────────────────────────────────
// Looks up WaniKani level for a vocabulary item
async function handleWanikani(token, word, origin) {
  if (!token) return json({ error: 'NO_TOKEN' }, 400, origin);
  try {
    // Search vocabulary subjects matching the slug
    const url = `https://api.wanikani.com/v2/subjects?types=vocabulary,kanji&slugs=${encodeURIComponent(word)}`;
    const r = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Wanikani-Revision': '20170710',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return json({ error: err.error || 'WK_ERROR', status: r.status }, r.status, origin);
    }
    const d = await r.json();
    const subject = d.data?.[0];
    if (!subject) return json({ level: null }, 200, origin);
    return json({ level: subject.data?.level || null, type: subject.object }, 200, origin);
  } catch (e) {
    return json({ error: 'WK_FAILED' }, 200, origin);
  }
}

// ── Route: /reader?level=N3 ──────────────────────────────────────────────────
// Fetches recent NHK Web Easy articles (N3/N4 level news in simple Japanese)
async function handleReader(level, origin) {
  try {
    // NHK Web Easy RSS feed — real simplified news articles
    const r = await fetch('https://www3.nhk.or.jp/news/easy/k10013160801000/k10013160801000.json', {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error('NHK fetch failed');
    // Fallback: use the NHK Easy news list endpoint  
    const newsListUrl = 'https://www3.nhk.or.jp/news/easy/news-list.json';
    const r2 = await fetch(newsListUrl, { signal: AbortSignal.timeout(5000) });
    if (!r2.ok) throw new Error('NHK list failed');
    const list = await r2.json();
    // list is an array of weeks, each week is an object of date→[articles]
    const articles = [];
    for (const week of Object.values(list[0] || {})) {
      for (const item of (week || [])) {
        articles.push({
          title: item.title_with_ruby || item.title,
          newsId: item.news_id,
          date: item.news_prearranged_time,
          url: `https://www3.nhk.or.jp/news/easy/${item.news_id}/${item.news_id}.html`,
        });
        if (articles.length >= 10) break;
      }
      if (articles.length >= 10) break;
    }
    return json({ data: articles, level: 'N3-N4', source: 'NHK Web Easy' }, 200, origin);
  } catch (e) {
    return json({ error: 'READER_FAILED', detail: e.message, data: [] }, 200, origin);
  }
}

// ── Handwriting proxy (Google Input Tools) ───────────────────────────────────
async function handleHandwrite(request, origin) {
  try {
    const body = await request.json();
    const r = await fetch(
      'https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(8000),
      }
    );
    const data = await r.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return json({ error: 'HANDWRITE_FAILED', detail: e.message }, 500, origin);
  }
}

// ── JLPT enrichment: use kanjiapi to fill in JLPT level ───────────────────────
// Jotoba rarely returns jlpt_lvl; kanjiapi /v1/kanji/{char} is much more reliable.
async function enrichJlpt(results, keyword) {
  const firstWord = results[0]?.japanese[0]?.word || keyword;
  const kanji = [...firstWord].find(c => /[\u4e00-\u9fff\u3400-\u4dbf]/.test(c));
  if (!kanji) return results;
  if (results.every(r => r.jlpt && r.jlpt.length)) return results;
  try {
    const r = await fetch('https://kanjiapi.dev/v1/kanji/' + encodeURIComponent(kanji), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) return results;
    const k = await r.json();
    if (!k.jlpt) return results;
    // kanjiapi returns jlpt as e.g. "N3" — convert to "jlpt-n3"
    const tag = 'jlpt-n' + k.jlpt;  // kanjiapi returns jlpt as NUMBER e.g. 1,2,3
    return results.map(res => ({
      ...res,
      jlpt: (res.jlpt && res.jlpt.length) ? res.jlpt : [tag],
    }));
  } catch (_) {
    return results;
  }
}

// ── Dictionary lookup ────────────────────────────────────────────────────────
async function handleDictionary(keyword, origin) {

  // 1️⃣  Jotoba — best quality, handles romaji/kana/kanji
  const jotobaResult = await tryJotoba(keyword);
  if (jotobaResult.length) {
    const enriched = await enrichJlpt(jotobaResult, keyword);
    return okJson({ meta: { status: 200, source: 'jotoba' }, data: enriched }, origin);
  }

  // 2️⃣  Jotoba retry with hiragana — romaji→kana conversion often gets better hits
  const kana = romajiToHiragana(keyword);
  if (kana && kana !== keyword) {
    const kanaResult = await tryJotoba(kana);
    if (kanaResult.length) {
      const enriched = await enrichJlpt(kanaResult, kana);
      return okJson({ meta: { status: 200, source: 'jotoba-kana' }, data: enriched }, origin);
    }
  }
  // 3️⃣  Kanjiapi.dev — only works for kanji-initial queries
  const firstChar = [...keyword][0] || '';
  const isKanji   = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(firstChar);

  if (isKanji) {
    // Words endpoint
    try {
      const r = await fetch(`https://kanjiapi.dev/v1/words/${encodeURIComponent(firstChar)}`, {
        headers: { 'Accept': 'application/json' },
        signal:  AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const words = await r.json();
        const data  = normaliseKanjiapi(words, keyword);
        if (data.length) {
          return okJson({ meta: { status: 200, source: 'kanjiapi' }, data }, origin);
        }
      }
    } catch (_) {}

    // Kanji detail endpoint
    try {
      const r = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(firstChar)}`, {
        headers: { 'Accept': 'application/json' },
        signal:  AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const k    = await r.json();
        const data = normaliseKanjiDetail(k, firstChar);
        if (data.length) {
          return okJson({ meta: { status: 200, source: 'kanjiapi-detail' }, data }, origin);
        }
      }
    } catch (_) {}
  }

  // 4️⃣  All failed
  return json(
    { error: 'DICTIONARY_UNAVAILABLE', detail: 'All upstream APIs failed', data: [] },
    200, origin
  );
}


// ── NHK Easy News handlers ────────────────────────────────────────────────

async function handleNhkList(origin) {
  try {
    const r = await fetch('https://www3.nhk.or.jp/news/easy/top-list.json', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('NHK top-list ' + r.status);
    const list = await r.json();
    // Each item has news_id, title, news_prearranged_time
    const articles = (list || []).slice(0, 20).map(item => ({
      title: item.title_with_ruby ? stripRuby(item.title_with_ruby) : item.title,
      date:  (item.news_prearranged_time || '').slice(0, 10),
      url:   `https://www3.nhk.or.jp/news/easy/${item.news_id}/${item.news_id}.html`,
      id:    item.news_id,
    }));
    return okJson({ articles }, origin);
  } catch (e) {
    return json({ error: 'NHK_UNAVAILABLE', detail: e.message, articles: [] }, 200, origin);
  }
}

async function handleNhkArticle(articleUrl, origin) {
  // Validate it's an NHK URL to prevent SSRF
  if (!articleUrl.startsWith('https://www3.nhk.or.jp/news/easy/')) {
    return json({ error: 'INVALID_URL' }, 400, origin);
  }
  try {
    const r = await fetch(articleUrl, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const html = await r.text();
    // Extract the article body — NHK Easy wraps content in <div class="article-main__body">
    const bodyMatch = html.match(/class="article-main__body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div/);
    let body = '';
    if (bodyMatch) {
      body = bodyMatch[1];
    } else {
      // fallback: grab content between <p> tags with Japanese text
      const ps = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
      body = ps.filter(p => /[\u3040-\u9fff]/.test(p)).slice(0, 20).join('\n');
    }
    // Clean up NHK's ruby to standard ruby HTML
    body = body.replace(/<span class="colour[^"]*">/g, '').replace(/<\/span>/g, '');
    return okJson({ html: body || '<p>Article content not available.</p>' }, origin);
  } catch (e) {
    return json({ error: 'ARTICLE_FAILED', detail: e.message }, 200, origin);
  }
}

// Strip <ruby> tags, keep base text
function stripRuby(s) {
  return s.replace(/<ruby[^>]*>(.*?)<\/ruby>/gs, (_, inner) => {
    return inner.replace(/<rt[^>]*>.*?<\/rt>/gs, '').replace(/<[^>]+>/g, '');
  });
}

// ── Jotoba helper (try once, 3 s timeout) ────────────────────────────────────
async function tryJotoba(query) {
  try {
    const r = await fetch('https://jotoba.de/api/search/words', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ query, no_english: false, language: 'English' }),
      signal:  AbortSignal.timeout(3000),
    });
    if (!r.ok) return [];
    const jd = await r.json();
    return normaliseJotoba(jd.words || []);
  } catch (_) {
    return [];
  }
}

// ── Romaji → Hiragana converter ───────────────────────────────────────────────
// Covers standard Hepburn romaji. Multi-char sequences checked before single-char.
function romajiToHiragana(str) {
  if (!str || /[^\x00-\x7F]/.test(str)) return '';   // already non-ASCII, skip
  const s = str.toLowerCase();

  const MAP = [
    // Long vowels / digraphs — must come before single-char matches
    ['uu','う'],['oo','おお'],['ou','おう'],
    // Three-char combos
    ['sha','しゃ'],['shi','し'],['shu','しゅ'],['she','しぇ'],['sho','しょ'],
    ['chi','ち'],['cha','ちゃ'],['chu','ちゅ'],['che','ちぇ'],['cho','ちょ'],
    ['tsu','つ'],
    ['dzu','づ'],['dzi','ぢ'],
    ['kya','きゃ'],['kyu','きゅ'],['kyo','きょ'],
    ['nya','にゃ'],['nyu','にゅ'],['nyo','にょ'],
    ['hya','ひゃ'],['hyu','ひゅ'],['hyo','ひょ'],
    ['mya','みゃ'],['myu','みゅ'],['myo','みょ'],
    ['rya','りゃ'],['ryu','りゅ'],['ryo','りょ'],
    ['gya','ぎゃ'],['gyu','ぎゅ'],['gyo','ぎょ'],
    ['bya','びゃ'],['byu','びゅ'],['byo','びょ'],
    ['pya','ぴゃ'],['pyu','ぴゅ'],['pyo','ぴょ'],
    ['nja','にゃ'],['nyu','にゅ'],['nyo','にょ'],
    // Double consonants → っ + consonant
    // handled inline below
    // Two-char combos
    ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
    ['sa','さ'],['si','し'],['su','す'],['se','せ'],['so','そ'],
    ['ta','た'],['ti','ち'],['tu','つ'],['te','て'],['to','と'],
    ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
    ['ha','は'],['hi','ひ'],['hu','ふ'],['he','へ'],['ho','ほ'],
    ['fu','ふ'],
    ['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
    ['ya','や'],['yu','ゆ'],['yo','よ'],
    ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
    ['wa','わ'],['wi','ゐ'],['we','ゑ'],['wo','を'],
    ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
    ['za','ざ'],['zi','じ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
    ['ji','じ'],['ja','じゃ'],['ju','じゅ'],['jo','じょ'],
    ['da','だ'],['di','ぢ'],['du','づ'],['de','で'],['do','ど'],
    ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
    ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
    // Single vowels
    ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お'],
    // n before consonant or end
    ['n','ん'],
  ];

  let result = '';
  let i = 0;
  while (i < s.length) {
    // Double consonant → っ
    if (s[i] === s[i+1] && s[i] !== 'n' && /[a-z]/.test(s[i])) {
      result += 'っ';
      i++;
      continue;
    }
    let matched = false;
    for (const [rom, hira] of MAP) {
      if (s.startsWith(rom, i)) {
        result += hira;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) { result += s[i]; i++; }
  }
  return result;
}

// ── Normalisers ───────────────────────────────────────────────────────────────

// Jotoba pos can be: string | string[] | {Tag:val} | array of those
function posToStrings(pos) {
  if (!pos) return [];
  const flatten = (p) => {
    if (typeof p === 'string')      return p ? [p] : [];
    if (Array.isArray(p))           return p.flatMap(flatten);
    if (p && typeof p === 'object') { const k = Object.keys(p)[0]; return k ? [k] : []; }
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

function normaliseKanjiapi(words, keyword) {
  const out = [];
  for (const entry of words) {
    const variant = entry.variants?.find(v =>
      v.written === keyword ||
      v.written?.includes(keyword) ||
      keyword.includes(v.written || '')
    ) || entry.variants?.[0];
    if (!variant) continue;

    const meanings = (entry.meanings_in_context || []).map(m => m.meaning).filter(Boolean);
    if (!meanings.length) continue;

    out.push({
      japanese: [{ word: variant.written || '', reading: variant.pronounced || '' }],
      senses:   [{ english_definitions: meanings, parts_of_speech: [] }],
      jlpt:     [],
      is_common: false,
    });
    if (out.length >= 6) break;
  }
  return out;
}

function normaliseKanjiDetail(k, char) {
  const meanings = k.meanings || [];
  if (!meanings.length) return [];
  return [{
    japanese: [{ word: char, reading: (k.kun_readings || [])[0] || (k.on_readings || [])[0] || '' }],
    senses:   [{ english_definitions: meanings, parts_of_speech: [] }],
    jlpt:     k.jlpt ? [`jlpt-n${k.jlpt}`] : [],
    is_common: false,
  }];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function json(body, status = 200, origin = '*') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function okJson(body, origin) {
  return json(body, 200, origin);
}
