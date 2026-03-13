/* =============================================================
   Cloudflare Worker — Dictionary + Handwriting + NHK + Kaiwa proxy
   ============================================================= */

export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (url.pathname === '/handwrite') {
      return handleHandwrite(request, origin);
    }

    // ── Kaiwa — conversation practice via Gemini API ────────────────────────
    if (url.pathname === '/kaiwa') {
      return handleKaiwa(request, env, origin);
    }

    // ── NHK Easy News: article list ───────────────────────────────────────────
    if (url.searchParams.has('nhk')) {
      return handleNhkList(origin);
    }

    // ── NHK Easy News: single article body ───────────────────────────────────
    const nhkUrl = url.searchParams.get('nhk_article');
    if (nhkUrl) {
      return handleNhkArticle(nhkUrl, origin);
    }

    // ── Dictionary ────────────────────────────────────────────────────────────
    const keyword = url.searchParams.get('keyword')?.trim() || '';
    if (!keyword) {
      return json({ error: 'MISSING_KEYWORD', data: [] }, 400, origin);
    }
    return handleDictionary(keyword, origin);
  }
};

// ── Kaiwa — Conversation practice via Gemini Flash ──────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const KAIWA_SYSTEM_PROMPTS = {
  auto: `You are a friendly Japanese conversation partner in a language learning app called 積読フレンド.
The user's level is unknown — adapt to whatever they write. If they write simple sentences, keep your Japanese simple. If they write complex Japanese, match that level.

RESPONSE FORMAT — you MUST follow this exactly:
1. First, reply naturally in Japanese as a conversation partner. Ask a follow-up question to keep the chat going. Keep your reply concise (2-4 sentences).
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide corrections and notes IN ENGLISH:
   - If there were mistakes, show: ~~wrong~~ → **correct** and explain briefly
   - Note any unnatural phrasing and suggest more natural alternatives
   - If their Japanese was perfect, say so and optionally teach a related word or grammar point
   - Mention what JLPT level you estimate they're at

Always be encouraging. Keep corrections concise and focused on the most important points.`,

  beginner: `You are a friendly Japanese conversation partner for a BEGINNER learner (around JLPT N5 level) in a language learning app.

RULES FOR YOUR JAPANESE:
- Use only basic vocabulary and simple grammar (です/ます form)
- Keep sentences short. Use common words only.
- Avoid keigo, complex conjugations, or compound sentences
- If the user seems lost, gently simplify further

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in simple Japanese (1-3 short sentences). Ask a simple follow-up question.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide corrections IN ENGLISH:
   - Show mistakes: ~~wrong~~ → **correct** with simple explanations
   - Focus on particles, basic verb forms, and word order
   - Suggest helpful vocabulary related to the conversation
   - Always be very encouraging — learning Japanese is hard!`,

  intermediate: `You are a friendly Japanese conversation partner for an INTERMEDIATE learner (around JLPT N4-N3) in a language learning app.

RULES FOR YOUR JAPANESE:
- Use natural, everyday Japanese with です/ます or casual form depending on the user's style
- You can use て-form connections, たり〜たり, ～たことがある, conditionals (たら/ば), etc.
- Keep vocabulary at a daily-life level. Introduce occasional new words with context.
- Use some compound sentences but don't go overboard

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in Japanese (2-4 sentences). Ask a follow-up question to continue the conversation.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide corrections IN ENGLISH:
   - Show mistakes: ~~wrong~~ → **correct** with grammar explanations
   - Point out unnatural phrasing and suggest natural alternatives
   - Teach useful expressions or collocations related to the topic
   - Be encouraging while being thorough with corrections`,

  advanced: `You are a Japanese conversation partner for an ADVANCED learner (JLPT N2-N1 level) in a language learning app.

RULES FOR YOUR JAPANESE:
- Write natural, adult Japanese. Use keigo where appropriate.
- Feel free to use complex grammar, idiomatic expressions, 四字熟語, formal/informal register shifts
- You can discuss abstract topics, current events, opinions
- Write as you would to a Japanese adult, but remain clear

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in natural Japanese (2-5 sentences). Engage thoughtfully with what they said. Ask a follow-up question.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide notes IN ENGLISH:
   - Correct any mistakes: ~~wrong~~ → **correct**
   - Point out subtle nuance issues, register mismatches, or unnatural word choices
   - Suggest more sophisticated alternatives where relevant
   - Teach advanced expressions, collocations, or grammar patterns`,

  n5: `You are a friendly Japanese conversation partner for a JLPT N5 level learner. Use only N5 vocabulary and grammar. Keep sentences very short and simple. Use です/ます form only. Avoid kanji beyond basic N5 kanji — prefer hiragana for other words.

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in very simple Japanese (1-2 short sentences). Ask a simple question.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide corrections IN ENGLISH with ~~wrong~~ → **correct** format. Be very encouraging.`,

  n4: `You are a Japanese conversation partner for a JLPT N4 level learner. Use N5-N4 vocabulary and grammar. You can use て-form, ない-form, past tense, たい, simple conditionals. Keep it conversational but not too complex.

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in Japanese (2-3 sentences). Ask a follow-up question.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide corrections IN ENGLISH with ~~wrong~~ → **correct** format.`,

  n3: `You are a Japanese conversation partner for a JLPT N3 level learner. Use N5-N3 vocabulary and grammar. You can use compound sentences, ようにする, ことにする, passive, causative basics, various conditionals. Natural everyday Japanese.

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in Japanese (2-4 sentences). Ask a follow-up question.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide corrections IN ENGLISH with ~~wrong~~ → **correct** format. Point out grammar and naturalness issues.`,

  n2: `You are a Japanese conversation partner for a JLPT N2 level learner. Use a wide vocabulary. Complex grammar is fine: ～にもかかわらず, ～に対して, ～わけではない, etc. Discuss topics with nuance. Mix formal and casual as fits context.

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in natural Japanese (2-5 sentences). Engage with their ideas. Ask a follow-up question.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide detailed corrections IN ENGLISH. Focus on nuance, register, and advanced grammar.`,

  n1: `You are a Japanese conversation partner for a JLPT N1 level learner. Write fully natural Japanese — literary expressions, keigo, 四字熟語, idiomatic phrases are all fair game. Engage at the level of an educated Japanese adult.

RESPONSE FORMAT — you MUST follow this exactly:
1. Reply in natural Japanese (2-5 sentences). Engage thoughtfully.
2. Then write this exact separator on its own line: 【添削】
3. After the separator, provide notes IN ENGLISH on any mistakes, nuance issues, or register choices. Suggest more sophisticated alternatives. Teach advanced expressions.`,
};

const KAIWA_TOPIC_HINTS = {
  jikoshoukai: 'The conversation topic is self-introduction (自己紹介). Help the user practice introducing themselves.',
  kaimono:     'The conversation topic is shopping (買い物). Use vocabulary related to shopping, prices, sizes, preferences.',
  restaurant:  'The conversation topic is eating at a restaurant (レストラン). Practice ordering, asking about the menu, expressing preferences.',
  travel:      'The conversation topic is travel (旅行). Discuss trips, destinations, transportation, experiences.',
  hobby:       'The conversation topic is hobbies (趣味). Ask about and discuss hobbies, interests, free time.',
  work:        'The conversation topic is work or school (仕事・学校). Discuss daily routines, responsibilities, goals.',
  opinion:     'The conversation topic is sharing opinions (意見). Practice expressing agreement, disagreement, reasoning.',
  directions:  'The conversation topic is asking for directions (道案内). Practice location words, giving/receiving directions.',
};

async function handleKaiwa(request, env, origin) {
  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405, origin);
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'KAIWA_NOT_CONFIGURED', detail: 'Missing GEMINI_API_KEY secret' }, 500, origin);
  }

  try {
    const body = await request.json();
    const { messages, level, topic } = body;

    if (!messages || !Array.isArray(messages) || !messages.length) {
      return json({ error: 'NO_MESSAGES' }, 400, origin);
    }

    // Build system instruction
    const levelKey = (level || 'auto').toLowerCase();
    let systemInstruction = KAIWA_SYSTEM_PROMPTS[levelKey] || KAIWA_SYSTEM_PROMPTS.auto;
    if (topic && KAIWA_TOPIC_HINTS[topic]) {
      systemInstruction += '\n\n' + KAIWA_TOPIC_HINTS[topic];
    }

    // Convert messages to Gemini format
    // Gemini uses role: "user" / "model" (not "assistant")
    // Each message has parts: [{ text: "..." }]
    const contents = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 2000) }],
    }));

    // Gemini requires alternating user/model turns — merge consecutive same-role msgs
    const merged = [];
    for (const msg of contents) {
      if (merged.length && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        merged.push(msg);
      }
    }

    // Gemini requires the first message to be from "user"
    if (merged.length && merged[0].role === 'model') {
      merged.shift();
    }

    const geminiBody = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: merged,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.8,
      },
    };

    const r = await fetch(GEMINI_URL + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('Gemini API error:', r.status, errText);
      return json({ error: 'API_ERROR', status: r.status, detail: errText }, 502, origin);
    }

    const data = await r.json();

    // Extract text from Gemini response
    // Shape: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
    const reply = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('\n')
      || 'すみません、エラーが発生しました。もう一度試してください。';

    return okJson({ reply }, origin);
  } catch (e) {
    console.error('Kaiwa handler error:', e);
    return json({ error: 'KAIWA_FAILED', detail: e.message }, 500, origin);
  }
}

// ── NHK Easy News ─────────────────────────────────────────────────────────────

async function handleNhkList(origin) {
  try {
    const r = await fetch('https://www3.nhk.or.jp/news/easy/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error('NHK Easy homepage HTTP ' + r.status);
    const html = await r.text();

    const articles = [];
    const seenIds = new Set();

    const linkRe = /href="(\/news\/easy\/(k\d+)\/\2\.html)"[^>]*>([\s\S]*?)(?=<a |<\/li>|<\/div>)/g;
    let m;
    while ((m = linkRe.exec(html)) !== null && articles.length < 20) {
      const path  = m[1];
      const id    = m[2];
      const inner = m[3];
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const title = inner
        .replace(/<ruby[^>]*>(.*?)<\/ruby>/gs, (_, rb) => rb.replace(/<rt[^>]*>.*?<\/rt>/gs,'').replace(/<[^>]+>/g,''))
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,'')
        .replace(/\s+/g,' ').trim();

      if (!title || title.length < 3) continue;

      articles.push({
        title,
        date:  '',
        url:   'https://www3.nhk.or.jp' + path,
        id,
      });
    }

    if (!articles.length) {
      const simpleRe = /href="(\/news\/easy\/(k\d+)\/\2\.html)"/g;
      let sm;
      while ((sm = simpleRe.exec(html)) !== null && articles.length < 20) {
        const id = sm[2];
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        articles.push({
          title: id,
          date:  '',
          url:   'https://www3.nhk.or.jp' + sm[1],
          id,
        });
      }
    }

    if (!articles.length) throw new Error('No article links found in NHK Easy HTML');
    return okJson({ articles }, origin);
  } catch (e) {
    return json({ error: 'NHK_UNAVAILABLE', detail: e.message, articles: [] }, 200, origin);
  }
}

async function handleNhkArticle(articleUrl, origin) {
  if (!articleUrl.startsWith('https://www3.nhk.or.jp/news/easy/')) {
    return json({ error: 'INVALID_URL' }, 400, origin);
  }
  try {
    const r = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const html = await r.text();

    let body = '';
    const patterns = [
      /id="js-article-body"[^>]*>([\s\S]*?)<\/div>/,
      /class="article-main__body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|<\/section)/,
      /class="content--detail-main[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|<\/section)/,
      /<article[^>]*>([\s\S]*?)<\/article>/,
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m && m[1] && /[\u3040-\u9fff]/.test(m[1])) { body = m[1]; break; }
    }
    if (!body) {
      const ps = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
      body = ps.filter(p => /[\u3040-\u9fff]/.test(p)).slice(0, 30).join('\n');
    }

    body = body
      .replace(/<rb[^>]*>/g, '').replace(/<\/rb>/g, '')
      .replace(/<span[^>]*class="colour[^"]*"[^>]*>/g, '').replace(/<\/span>/g, '')
      .replace(/\s{2,}/g, ' ');

    return okJson({ html: body || '<p>Article content not available.</p>' }, origin);
  } catch (e) {
    return json({ error: 'ARTICLE_FAILED', detail: e.message }, 200, origin);
  }
}

// ── Handwriting proxy ─────────────────────────────────────────────────────────

async function handleHandwrite(request, origin) {
  try {
    const body = await request.json();
    const r = await fetch(
      'https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
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

// ── JLPT enrichment ───────────────────────────────────────────────────────────

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
    if (k.jlpt == null) return results;
    const tag = 'jlpt-n' + k.jlpt;
    return results.map(res => ({
      ...res,
      jlpt: (res.jlpt && res.jlpt.length) ? res.jlpt : [tag],
    }));
  } catch (_) {
    return results;
  }
}

// ── Dictionary ────────────────────────────────────────────────────────────────

async function handleDictionary(keyword, origin) {
  const jotobaResult = await tryJotoba(keyword);
  if (jotobaResult.length) {
    return okJson({ meta: { status: 200, source: 'jotoba' }, data: await enrichJlpt(jotobaResult, keyword) }, origin);
  }

  const kana = romajiToHiragana(keyword);
  if (kana && kana !== keyword) {
    const kanaResult = await tryJotoba(kana);
    if (kanaResult.length) {
      return okJson({ meta: { status: 200, source: 'jotoba-kana' }, data: await enrichJlpt(kanaResult, kana) }, origin);
    }
  }

  const firstChar = [...keyword][0] || '';
  const isKanji   = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(firstChar);

  if (isKanji) {
    try {
      const r = await fetch(`https://kanjiapi.dev/v1/words/${encodeURIComponent(firstChar)}`, {
        headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = normaliseKanjiapi(await r.json(), keyword);
        if (data.length) return okJson({ meta: { status: 200, source: 'kanjiapi' }, data }, origin);
      }
    } catch (_) {}

    try {
      const r = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(firstChar)}`, {
        headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = normaliseKanjiDetail(await r.json(), firstChar);
        if (data.length) return okJson({ meta: { status: 200, source: 'kanjiapi-detail' }, data }, origin);
      }
    } catch (_) {}
  }

  return json({ error: 'DICTIONARY_UNAVAILABLE', detail: 'All upstream APIs failed', data: [] }, 200, origin);
}

async function tryJotoba(query) {
  try {
    const r = await fetch('https://jotoba.de/api/search/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, no_english: false, language: 'English' }),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return [];
    return normaliseJotoba((await r.json()).words || []);
  } catch (_) { return []; }
}

// ── Romaji → Hiragana ─────────────────────────────────────────────────────────

function romajiToHiragana(str) {
  if (!str || /[^\x00-\x7F]/.test(str)) return '';
  const s = str.toLowerCase();
  const MAP = [
    ['sha','しゃ'],['shi','し'],['shu','しゅ'],['she','しぇ'],['sho','しょ'],
    ['chi','ち'],['cha','ちゃ'],['chu','ちゅ'],['che','ちぇ'],['cho','ちょ'],
    ['tsu','つ'],['dzu','づ'],['dzi','ぢ'],
    ['kya','きゃ'],['kyu','きゅ'],['kyo','きょ'],['nya','にゃ'],['nyu','にゅ'],['nyo','にょ'],
    ['hya','ひゃ'],['hyu','ひゅ'],['hyo','ひょ'],['mya','みゃ'],['myu','みゅ'],['myo','みょ'],
    ['rya','りゃ'],['ryu','りゅ'],['ryo','りょ'],['gya','ぎゃ'],['gyu','ぎゅ'],['gyo','ぎょ'],
    ['bya','びゃ'],['byu','びゅ'],['byo','びょ'],['pya','ぴゃ'],['pyu','ぴゅ'],['pyo','ぴょ'],
    ['uu','う'],['oo','おお'],['ou','おう'],
    ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
    ['sa','さ'],['si','し'],['su','す'],['se','せ'],['so','そ'],
    ['ta','た'],['ti','ち'],['tu','つ'],['te','て'],['to','と'],
    ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
    ['ha','は'],['hi','ひ'],['hu','ふ'],['he','へ'],['ho','ほ'],
    ['fu','ふ'],['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
    ['ya','や'],['yu','ゆ'],['yo','よ'],
    ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
    ['wa','わ'],['wo','を'],
    ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
    ['za','ざ'],['zi','じ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
    ['ji','じ'],['ja','じゃ'],['ju','じゅ'],['jo','じょ'],
    ['da','だ'],['di','ぢ'],['du','づ'],['de','で'],['do','ど'],
    ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
    ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
    ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お'],['n','ん'],
  ];
  let result = '', i = 0;
  while (i < s.length) {
    if (s[i] === s[i+1] && s[i] !== 'n' && /[a-z]/.test(s[i])) { result += 'っ'; i++; continue; }
    let matched = false;
    for (const [rom, hira] of MAP) {
      if (s.startsWith(rom, i)) { result += hira; i += rom.length; matched = true; break; }
    }
    if (!matched) { result += s[i]; i++; }
  }
  return result;
}

// ── Normalisers ───────────────────────────────────────────────────────────────

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
    japanese: [{ word: w.reading?.kanji || w.reading?.kana || '', reading: w.reading?.kana || '' }],
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
      v.written === keyword || v.written?.includes(keyword) || keyword.includes(v.written || '')
    ) || entry.variants?.[0];
    if (!variant) continue;
    const meanings = (entry.meanings_in_context || []).map(m => m.meaning).filter(Boolean);
    if (!meanings.length) continue;
    out.push({
      japanese: [{ word: variant.written || '', reading: variant.pronounced || '' }],
      senses:   [{ english_definitions: meanings, parts_of_speech: [] }],
      jlpt: [], is_common: false,
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
    jlpt:     k.jlpt != null ? [`jlpt-n${k.jlpt}`] : [],
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

function okJson(body, origin) { return json(body, 200, origin); }
