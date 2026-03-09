/* =========================
   KANKEN — 漢字検定 Practice
   Active-recall edition:
   - 読み       → type reading (romaji or kana), auto-scored
   - 書き       → draw on canvas, HW recognition, auto-scored (3-attempt limit)
   - 画数       → 4-choice buttons, auto-scored
   - 部首       → 4-choice buttons (radical options), auto-scored
   - 送り仮名   → type the okurigana, auto-scored
   - 四字熟語   → 4-choice (which kanji completes it?), auto-scored
   - 対義語     → type the antonym, auto-scored where data exists
========================= */

/* ── State ─────────────────────────────────────────── */
const kk = {
  level:        '5',
  section:      null,
  queue:        [],
  idx:          0,
  score:        { correct: 0, wrong: 0 },
  current:      null,
  answered:     false,
  wrongItems:   [],
  kakiAttempts: 0,
  levels:       null,
  yoji:         null,
  kanjiCache:   {},
  levelPool:    [],
};

/* ── Level / section metadata ──────────────────────── */
const KK_LEVEL_LABELS = {
  '10':'10級','9':'9級','8':'8級','7':'7級',
  '6':'6級','5':'5級','4':'4級','3':'3級',
  'j2':'準2級','2':'2級','j1':'準1級',
};
const KK_SECTIONS = {
  low:  ['yomi','kaki','bushu','kakusuu','okurigana'],
  mid:  ['yomi','kaki','bushu','kakusuu','okurigana','yoji'],
  high: ['yomi','kaki','bushu','kakusuu','okurigana','yoji','taigi'],
};
function kkSectionsForLevel(lvl) {
  if (['10','9','8','7'].includes(lvl)) return KK_SECTIONS.low;
  if (['6','5'].includes(lvl))          return KK_SECTIONS.mid;
  return KK_SECTIONS.high;
}
const SECTION_LABELS = {
  yomi:'読み', kaki:'書き', bushu:'部首', kakusuu:'画数',
  okurigana:'送り仮名', yoji:'四字熟語', taigi:'対義語・類義語',
};

/* ── Romaji → Hiragana ──────────────────────────────── */
function kkRomajiToHira(str) {
  if (!str) return '';
  if (/[\u3040-\u30ff]/.test(str))
    return str.replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const s = str.toLowerCase().trim();
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

function kkNormRead(r) {
  if (!r) return '';
  return r.replace(/\..*$/, '')
          .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
          .replace(/ー/g, '');
}

/* ── Data loading ──────────────────────────────────── */
async function kkLoadLevels() {
  if (kk.levels) return kk.levels;
  try {
    const r = await fetch('kanken-levels.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    kk.levels = await r.json(); return kk.levels;
  } catch(e) { console.error('[kanken] levels', e); return null; }
}

async function kkLoadYoji() {
  if (kk.yoji) return kk.yoji;
  try {
    const r = await fetch('yoji.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    kk.yoji = await r.json(); return kk.yoji;
  } catch(e) { console.error('[kanken] yoji', e); return null; }
}

async function kkFetchKanji(char) {
  if (kk.kanjiCache[char] !== undefined) return kk.kanjiCache[char];
  const stored = localStorage.getItem('kk-kanji-' + char);
  if (stored) { try { kk.kanjiCache[char] = JSON.parse(stored); return kk.kanjiCache[char]; } catch(_) {} }
  try {
    const r = await fetch('https://kanjiapi.dev/v1/kanji/' + encodeURIComponent(char), { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    kk.kanjiCache[char] = data;
    try { localStorage.setItem('kk-kanji-' + char, JSON.stringify(data)); } catch(_) {}
    return data;
  } catch(e) { kk.kanjiCache[char] = null; return null; }
}

/* ── Queue builders ────────────────────────────────── */
function kkShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

async function kkBuildQueue(level, section) {
  const levels = await kkLoadLevels();
  if (!levels) return null;
  const levelOrder = ['10','9','8','7','6','5','4','3','j2','2','j1'];
  const levelIdx = levelOrder.indexOf(level);
  let pool = [];
  for (let i = 0; i <= levelIdx; i++) { const k = levels[levelOrder[i]]; if (k) pool = pool.concat(k); }
  pool = [...new Set(pool)];
  kk.levelPool = pool;

  if (section === 'yoji') {
    const yojiData = await kkLoadYoji();
    if (!yojiData) return null;
    const yojiLevels = ['5','4','3','j2','2','j1','1'];
    const yojiIdx = yojiLevels.indexOf(level);
    if (yojiIdx < 0) return [];
    let yojiPool = [];
    for (let i = 0; i <= yojiIdx; i++) { const arr = yojiData[yojiLevels[i]]; if (arr) yojiPool = yojiPool.concat(arr); }
    kk._yojiPool = yojiPool;
    return kkShuffle(yojiPool).slice(0, 20).map(item => ({ type: 'yoji', ...item }));
  }

  const n = ['bushu','kakusuu','okurigana','taigi'].includes(section) ? 15 : 20;
  return kkShuffle(pool).slice(0, n).map(k => ({ type: section, kanji: k }));
}

/* ── Setup UI ──────────────────────────────────────── */
function kkRenderSetup() {
  const el = document.getElementById('kk-setup');
  if (!el) return;
  const levelOpts = Object.entries(KK_LEVEL_LABELS)
    .map(([v,l]) => `<option value="${v}" ${v===kk.level?'selected':''}>${l}</option>`).join('');
  const sections = kkSectionsForLevel(kk.level);
  const sectionBtns = sections.map(s => `
    <button class="kk-section-btn ${kk.section===s?'active':''}" onclick="kkSelectSection('${s}')" type="button">
      <span class="kk-section-jp">${SECTION_LABELS[s]}</span>
    </button>`).join('');
  el.innerHTML = `
    <div class="kk-setup-inner">
      <div class="kk-level-row">
        <label class="kk-label">級を選ぶ</label>
        <select class="kk-select" onchange="kkChangeLevel(this.value)">${levelOpts}</select>
      </div>
      <div class="kk-section-label kk-label">問題の種類</div>
      <div class="kk-section-grid">${sectionBtns}</div>
      ${kk.section
        ? `<button class="btn kk-start-btn" onclick="kkStartQuiz()" type="button">練習開始 →</button>`
        : `<p class="status-msg kk-hint">問題の種類を選んでください。</p>`}
    </div>`;
}

function kkChangeLevel(val) { kk.level = val; kk.section = null; kkRenderSetup(); }
function kkSelectSection(s) { kk.section = s; kkRenderSetup(); }

/* ── Quiz start ────────────────────────────────────── */
async function kkStartQuiz() {
  const setupEl = document.getElementById('kk-setup');
  const quizEl  = document.getElementById('kk-quiz');
  if (!setupEl || !quizEl) return;
  setupEl.style.display = 'none';
  quizEl.classList.add('active');
  quizEl.innerHTML = `<p class="status-msg" style="padding:32px;text-align:center">問題を準備中…</p>`;
  const queue = await kkBuildQueue(kk.level, kk.section);
  if (!queue || !queue.length) {
    quizEl.innerHTML = `<p class="status-msg" style="padding:32px;text-align:center">データを読み込めませんでした。ページをリロードしてください。</p>`;
    return;
  }
  Object.assign(kk, { queue, idx:0, score:{correct:0,wrong:0}, wrongItems:[], answered:false, current:null, kakiAttempts:0 });
  kkRenderQuestion();
}

/* ── Shared shell ──────────────────────────────────── */
function kkShell(innerHtml) {
  const done=kk.idx, total=kk.queue.length, pct=total?(done/total*100):0;
  return `
    <div class="kk-quiz-inner">
      <div class="kk-progress-bar"><div class="kk-progress-fill" style="width:${pct}%"></div></div>
      <div class="kk-counter">${done+1} / ${total}
        <span class="kk-score-inline">
          <span class="kk-correct-count">✓ ${kk.score.correct}</span>
          <span class="kk-wrong-count">✗ ${kk.score.wrong}</span>
        </span>
      </div>
      <div class="kk-section-tag">${SECTION_LABELS[kk.section]} — ${KK_LEVEL_LABELS[kk.level]}</div>
      <div class="kk-question-card" id="kk-question-card">${innerHtml}</div>
    </div>`;
}

const KK_PROMPTS = {
  yomi:'次の漢字の読みを答えよ', kaki:'次の読みの漢字を書け',
  kakusuu:'次の漢字の総画数を答えよ', bushu:'次の漢字の部首を答えよ',
  okurigana:'送り仮名を入力せよ', yoji:'四字熟語を完成させよ', taigi:'対義語を答えよ',
};

/* ── Main render dispatcher ────────────────────────── */
async function kkRenderQuestion() {
  const quizEl = document.getElementById('kk-quiz');
  if (!quizEl) return;
  if (kk.idx >= kk.queue.length) { kkShowResults(); return; }

  const item = kk.queue[kk.idx];
  kk.current = item; kk.answered = false; kk.kakiAttempts = 0;

  if (item.type === 'yoji') { await kkRenderYoji(item); return; }

  quizEl.innerHTML = kkShell(`
    <div class="kk-q-prompt">${KK_PROMPTS[item.type]}</div>
    <div class="kk-q-kanji" id="kk-q-kanji">${item.kanji}</div>
    <div class="kk-q-loading" id="kk-q-loading">読み込み中…</div>
    <div class="kk-answer-area" id="kk-answer-area" style="display:none"></div>`);

  const data     = await kkFetchKanji(item.kanji);
  const loadEl   = document.getElementById('kk-q-loading');
  const answerEl = document.getElementById('kk-answer-area');
  const kanjiEl  = document.getElementById('kk-q-kanji');
  if (loadEl) loadEl.style.display = 'none';
  if (!answerEl) return;
  answerEl.style.display = 'block';

  if (!data) {
    answerEl.innerHTML = `<p class="status-msg">データを取得できませんでした。</p>
      <button class="btn btn-sm btn-outline" onclick="kkNext()">次へ →</button>`;
    return;
  }

  switch (item.type) {
    case 'yomi':      kkRenderYomi(item, data, kanjiEl, answerEl);      break;
    case 'kaki':      kkRenderKaki(item, data, kanjiEl, answerEl);      break;
    case 'kakusuu':   kkRenderKakusuu(item, data, answerEl);            break;
    case 'bushu':     kkRenderBushu(item, data, answerEl);              break;
    case 'okurigana': kkRenderOkurigana(item, data, kanjiEl, answerEl); break;
    case 'taigi':     kkRenderTaigi(item, data, answerEl);              break;
  }
}

/* ── 読み: type reading ──────────────────────────────── */
function kkRenderYomi(item, data, kanjiEl, answerEl) {
  const accepted = [...(data.on_readings||[]), ...(data.kun_readings||[])].map(kkNormRead).filter(Boolean);
  if (!accepted.length) {
    answerEl.innerHTML = `<p class="status-msg kk-hint">読みデータなし</p>
      <button class="btn btn-sm btn-outline" onclick="kkNext()">次へ →</button>`;
    return;
  }
  item._accepted = accepted; item._data = data;
  answerEl.innerHTML = `
    <div class="kk-type-row">
      <input class="kk-type-input" id="kk-type-input" type="text"
        placeholder="読みを入力…" autocomplete="off" autocapitalize="off"
        onkeydown="if(event.key==='Enter'){event.preventDefault();kkSubmitYomi()}" />
      <button class="btn kk-submit-btn" onclick="kkSubmitYomi()" type="button">答える</button>
    </div>
    <div class="kk-feedback" id="kk-feedback"></div>`;
  requestAnimationFrame(() => document.getElementById('kk-type-input')?.focus());
}

function kkSubmitYomi() {
  if (kk.answered) return;
  const input = document.getElementById('kk-type-input');
  if (!input) return;
  const raw = input.value.trim(); if (!raw) { input.focus(); return; }
  const typed   = kkNormRead(kkRomajiToHira(raw));
  const item    = kk.current;
  const isRight = item._accepted.some(r => r === typed);
  kk.answered = true; input.disabled = true;
  const fb = document.getElementById('kk-feedback');
  const d  = item._data;
  if (isRight) {
    if (fb) fb.innerHTML = `<span class="kk-fb-correct">○ 正解！</span>`;
  } else {
    const onH  = d.on_readings?.length  ? `<div class="kk-reading-row"><span class="kk-read-label">音</span>${d.on_readings.map(r=>`<span class="kk-read-chip">${r}</span>`).join('')}</div>` : '';
    const kunH = d.kun_readings?.length ? `<div class="kk-reading-row"><span class="kk-read-label">訓</span>${d.kun_readings.map(r=>`<span class="kk-read-chip">${r}</span>`).join('')}</div>` : '';
    if (fb) fb.innerHTML = `<span class="kk-fb-wrong">✗ 不正解</span><div class="kk-readings-group" style="margin-top:8px">${onH}${kunH}</div>`;
  }
  kkMark(isRight);
}

/* ── 書き: canvas + HW recognition ─────────────────── */
function kkRenderKaki(item, data, kanjiEl, answerEl) {
  const reading = [...(data.on_readings||[]).map(r=>r), ...(data.kun_readings||[]).map(r=>r.replace(/\..*$/,''))].slice(0,3).join('・') || '?';
  const meaning = data.meanings?.slice(0,2).join(' / ') || '';
  if (kanjiEl) { kanjiEl.style.fontFamily="'Kosugi Maru',sans-serif"; kanjiEl.style.fontSize='2.2rem'; kanjiEl.textContent=reading; }
  answerEl.innerHTML = `
    ${meaning ? `<div class="kk-q-sub" style="margin-bottom:4px;opacity:0.65">${meaning}</div>` : ''}
    <div class="kk-kaki-canvas-wrap">
      <canvas id="kk-canvas" width="220" height="220" class="kk-canvas"></canvas>
    </div>
    <div class="kk-kaki-controls">
      <button class="btn btn-sm btn-outline" onclick="kkKakiClear()" type="button">クリア</button>
      <button class="btn btn-sm kk-submit-btn" id="kk-kaki-submit" onclick="kkKakiSubmit()" type="button">認識する</button>
    </div>
    <div class="kk-feedback" id="kk-feedback"></div>
    <div class="kk-attempt-dots" id="kk-attempt-dots">
      <span class="kk-dot active" id="kk-dot-0">●</span>
      <span class="kk-dot" id="kk-dot-1">●</span>
      <span class="kk-dot" id="kk-dot-2">●</span>
    </div>`;
  kkKakiInitCanvas();
}

const _kkC = { drawing:false, strokes:[], currentStroke:null, lastX:0, lastY:0 };

function kkKakiInitCanvas() {
  const canvas = document.getElementById('kk-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  _kkC.drawing=false; _kkC.strokes=[]; _kkC.currentStroke=null;
  function grid() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.strokeStyle='rgba(100,100,100,0.12)'; ctx.lineWidth=1; ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.moveTo(canvas.width/2,0); ctx.lineTo(canvas.width/2,canvas.height);
    ctx.moveTo(0,canvas.height/2); ctx.lineTo(canvas.width,canvas.height/2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  grid(); canvas._grid = grid;
  function pos(e) {
    const rect=canvas.getBoundingClientRect(), src=e.touches?e.touches[0]:e;
    return [(src.clientX-rect.left)*(canvas.width/rect.width),(src.clientY-rect.top)*(canvas.height/rect.height)];
  }
  function start(e) {
    e.preventDefault(); _kkC.drawing=true;
    const [x,y]=pos(e); _kkC.lastX=x; _kkC.lastY=y;
    _kkC.currentStroke=[{x,y,t:Date.now()}]; _kkC.strokes.push(_kkC.currentStroke);
  }
  function move(e) {
    if (!_kkC.drawing) return; e.preventDefault();
    const [x,y]=pos(e);
    ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--ink')||'#333';
    ctx.lineWidth=8; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(_kkC.lastX,_kkC.lastY); ctx.lineTo(x,y); ctx.stroke();
    _kkC.lastX=x; _kkC.lastY=y;
    if (_kkC.currentStroke) _kkC.currentStroke.push({x,y,t:Date.now()});
  }
  function end() { _kkC.drawing=false; ctx.beginPath(); }
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move);
  canvas.addEventListener('mouseup',end);     canvas.addEventListener('mouseleave',end);
  canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false});
  canvas.addEventListener('touchend',end);
}

function kkKakiClear() {
  const canvas=document.getElementById('kk-canvas'); if (!canvas) return;
  _kkC.strokes=[]; _kkC.currentStroke=null;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  if (canvas._grid) canvas._grid();
}

async function kkKakiSubmit() {
  if (kk.answered) return;
  const canvas=document.getElementById('kk-canvas'), fb=document.getElementById('kk-feedback');
  const btn=document.getElementById('kk-kaki-submit');
  const usable=_kkC.strokes.filter(s=>s&&s.length>=2);
  if (!usable.length) { if (fb) fb.innerHTML='<span class="kk-fb-hint">まず漢字を書いてください。</span>'; return; }
  if (btn) { btn.disabled=true; btn.textContent='認識中…'; }
  const endpoint=(window.TSUNDOKU_CONFIG&&window.TSUNDOKU_CONFIG.handwriteEndpoint)||'https://minireader.zoe-caudron.workers.dev/handwrite';
  try {
    const ink=usable.map(s=>([s.map(p=>Math.round(p.x)),s.map(p=>Math.round(p.y)),s.map(p=>Math.round(p.t||0))]));
    const payload={device:navigator.userAgent,options:'enable_pre_space',requests:[{writing_guide:{writing_area_width:canvas.width,writing_area_height:canvas.height},ink,language:'ja'}]};
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();
    const cands=[];
    function walk(node) {
      if (!node) return;
      if (Array.isArray(node)) { if (node.length&&node.every(x=>typeof x==='string')) { node.forEach(s=>{if(s.length===1&&/[\u3040-\u9fff]/.test(s))cands.push(s);}); } else node.forEach(walk); return; }
      if (typeof node==='object') Object.values(node).forEach(walk);
    }
    walk(data);
    const target=kk.current?.kanji, hit=cands.includes(target);
    kk.kakiAttempts++;
    if (hit) {
      kk.answered=true;
      if (fb) fb.innerHTML=`<span class="kk-fb-correct">○ 正解！ 認識: ${cands.slice(0,5).join(' ')}</span>`;
      kkMark(true); return;
    }
    const dot=document.getElementById(`kk-dot-${Math.min(kk.kakiAttempts-1,2)}`);
    if (dot) dot.classList.add('used');
    if (kk.kakiAttempts>=3) {
      kk.answered=true;
      if (fb) fb.innerHTML=`<span class="kk-fb-wrong">✗ 3回不正解</span><div style="margin-top:10px"><span style="font-size:0.85rem;opacity:0.7">答え：</span><span class="kk-kaki-answer">${target}</span></div>`;
      kkMark(false);
    } else {
      if (fb) fb.innerHTML=`<span class="kk-fb-wrong">✗ 認識: ${cands.slice(0,5).join(' ')||'なし'} — あと${3-kk.kakiAttempts}回</span>`;
      kkKakiClear();
      if (btn) { btn.disabled=false; btn.textContent='認識する'; }
    }
  } catch(e) {
    console.error('[kkKaki]',e);
    if (fb) fb.innerHTML='<span class="kk-fb-hint">認識エラー。もう一度描いてください。</span>';
    if (btn) { btn.disabled=false; btn.textContent='認識する'; }
  }
}

/* ── 画数: 4-choice ──────────────────────────────────── */
function kkRenderKakusuu(item, data, answerEl) {
  const s=data.stroke_count;
  if (s==null) { answerEl.innerHTML=`<p class="status-msg kk-hint">画数データなし</p><button class="btn btn-sm btn-outline" onclick="kkNext()">次へ →</button>`; return; }
  const choices=kkStrokeChoices(s);
  answerEl.innerHTML=`<div class="kk-choices">${choices.map(n=>`<button class="btn kk-choice-btn" onclick="kkCheckChoice(this,${n},${s})" type="button">${n}画</button>`).join('')}</div>`;
}

/* ── 部首: 4-choice with common radical distractors ─── */
function kkRenderBushu(item, data, answerEl) {
  const radical=data.radical;
  if (!radical) { answerEl.innerHTML=`<p class="status-msg kk-hint">部首データなし</p><button class="btn btn-sm btn-outline" onclick="kkNext()">次へ →</button>`; return; }
  const COMMON=['一','人','口','手','木','水','火','山','日','月','心','女','子','土','金','糸','竹','艹','言','足','門','雨','田','石','王','虫','米','目','耳','刀','力','弓','示'];
  const distractors=kkShuffle(COMMON.filter(r=>r!==radical)).slice(0,3);
  const choices=kkShuffle([radical,...distractors]);
  const esc=s=>s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  answerEl.innerHTML=`<div class="kk-choices">${choices.map(r=>`<button class="btn kk-choice-btn kk-choice-kanji" onclick="kkCheckChoiceStr(this,'${esc(r)}','${esc(radical)}')" type="button">${r}</button>`).join('')}</div>`;
}

/* ── 送り仮名: type the okurigana ───────────────────── */
function kkRenderOkurigana(item, data, kanjiEl, answerEl) {
  const kunWithOkuri=(data.kun_readings||[]).filter(r=>r.includes('.'));
  if (!kunWithOkuri.length) { answerEl.innerHTML=`<p class="status-msg kk-hint">送り仮名データなし</p><button class="btn btn-sm btn-outline" onclick="kkNext()">次へ →</button>`; return; }
  const pick=kunWithOkuri[Math.floor(Math.random()*kunWithOkuri.length)];
  const [base,okuri]=pick.split('.');
  item._okuri=okuri; item._base=base;
  if (kanjiEl) { kanjiEl.innerHTML=`${item.kanji}<span style="opacity:0.35">（　）</span>`; kanjiEl.style.fontFamily="'Kosugi Maru',sans-serif"; }
  answerEl.innerHTML=`
    <div style="font-size:0.85rem;opacity:0.6;margin-bottom:4px">読み: ${base}＿＿</div>
    <div class="kk-type-row">
      <input class="kk-type-input" id="kk-type-input" type="text"
        placeholder="送り仮名を入力…" autocomplete="off" autocapitalize="off"
        onkeydown="if(event.key==='Enter'){event.preventDefault();kkSubmitOkuri()}" />
      <button class="btn kk-submit-btn" onclick="kkSubmitOkuri()" type="button">答える</button>
    </div>
    <div class="kk-feedback" id="kk-feedback"></div>`;
  requestAnimationFrame(()=>document.getElementById('kk-type-input')?.focus());
}

function kkSubmitOkuri() {
  if (kk.answered) return;
  const input=document.getElementById('kk-type-input'); if (!input) return;
  const raw=input.value.trim(); if (!raw) { input.focus(); return; }
  const typed=kkNormRead(kkRomajiToHira(raw)), correct=kkNormRead(kk.current._okuri), isRight=typed===correct;
  kk.answered=true; input.disabled=true;
  const fb=document.getElementById('kk-feedback');
  if (isRight) {
    if (fb) fb.innerHTML=`<span class="kk-fb-correct">○ 正解！</span><div style="margin-top:6px"><span class="kk-okurigana-answer">${kk.current.kanji}<span class="kk-okuri-part">${kk.current._okuri}</span></span></div>`;
  } else {
    if (fb) fb.innerHTML=`<span class="kk-fb-wrong">✗ 不正解</span><div style="margin-top:8px"><span class="kk-okurigana-answer">${kk.current.kanji}<span class="kk-okuri-part">${kk.current._okuri}</span></span><span style="margin-left:10px;opacity:0.7">${kk.current._base}${kk.current._okuri}</span></div>`;
  }
  kkMark(isRight);
}

/* ── 四字熟語: 4-choice (which kanji completes?) ────── */
async function kkRenderYoji(item) {
  const quizEl=document.getElementById('kk-quiz'); if (!quizEl) return;
  const blanked=item.yoji.slice(0,3)+'□';
  const readingHint=item.reading.slice(0,-2)+'＿＿';
  const target=item.yoji[3];
  const pool=kk.levelPool||[];
  let candidates=pool.filter(k=>k!==target);

  // Try same-radical distractors from cache
  let targetData=null;
  try { targetData=await kkFetchKanji(target); } catch(_) {}
  const targetRadical=targetData?.radical;
  let sameRadical=[];
  if (targetRadical&&candidates.length>10) {
    for (const k of kkShuffle(candidates).slice(0,30)) {
      const cached=kk.kanjiCache[k]||null;
      if (cached&&cached.radical===targetRadical&&k!==target) { sameRadical.push(k); if (sameRadical.length>=3) break; }
    }
  }
  const distractors=[...sameRadical];
  const remaining=kkShuffle(candidates.filter(k=>!distractors.includes(k)));
  while (distractors.length<3&&remaining.length) distractors.push(remaining.pop());

  const choices=kkShuffle([target,...distractors.slice(0,3)]);
  const esc=s=>s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  quizEl.innerHTML=kkShell(`
    <div class="kk-q-prompt">四字熟語を完成させよ</div>
    <div class="kk-q-kanji" style="font-size:2.4rem;letter-spacing:0.06em;font-family:'Kosugi Maru',sans-serif">${blanked}</div>
    <div class="kk-q-sub">${readingHint}</div>
    <div class="kk-answer-area" id="kk-answer-area">
      <div class="kk-choices">
        ${choices.map(k=>`<button class="btn kk-choice-btn kk-choice-kanji" onclick="kkCheckChoiceStr(this,'${esc(k)}','${esc(target)}')" type="button">${k}</button>`).join('')}
      </div>
    </div>`);
}

/* ── 対義語: type the antonym ───────────────────────── */
function kkRenderTaigi(item, data, answerEl) {
  const antonyms=data.antonyms||[]; item._antonyms=antonyms; item._data=data;
  if (!antonyms.length) {
    answerEl.innerHTML=`
      <p class="status-msg kk-hint" style="margin-bottom:12px">対義語データなし（自己確認）</p>
      <button class="btn kk-reveal-btn" onclick="kkReveal(this)" type="button">意味を見る</button>
      <div class="kk-reveal-content" id="kk-reveal" style="display:none">
        ${data.meanings?.length?`<div style="opacity:0.7;font-size:0.9rem">${data.meanings.slice(0,3).join(' / ')}</div>`:''}
        <div class="kk-self-check">
          <span>分かった？</span>
          <button class="btn btn-sm kk-correct-btn" onclick="kkMark(true)" type="button">○ 正解</button>
          <button class="btn btn-sm kk-wrong-btn"   onclick="kkMark(false)" type="button">× 不正解</button>
        </div>
      </div>`;
    return;
  }
  answerEl.innerHTML=`
    <div class="kk-type-row">
      <input class="kk-type-input" id="kk-type-input" type="text"
        placeholder="対義語を入力…" autocomplete="off"
        onkeydown="if(event.key==='Enter'){event.preventDefault();kkSubmitTaigi()}" />
      <button class="btn kk-submit-btn" onclick="kkSubmitTaigi()" type="button">答える</button>
    </div>
    <div class="kk-feedback" id="kk-feedback"></div>`;
  requestAnimationFrame(()=>document.getElementById('kk-type-input')?.focus());
}

function kkSubmitTaigi() {
  if (kk.answered) return;
  const input=document.getElementById('kk-type-input'); if (!input) return;
  const raw=input.value.trim(); if (!raw) { input.focus(); return; }
  const isRight=kk.current._antonyms.some(a=>a===raw.trim());
  kk.answered=true; input.disabled=true;
  const fb=document.getElementById('kk-feedback');
  if (isRight) {
    if (fb) fb.innerHTML=`<span class="kk-fb-correct">○ 正解！</span>`;
  } else {
    const chips=kk.current._antonyms.slice(0,4).map(a=>`<span class="kk-read-chip">${a}</span>`).join('');
    if (fb) fb.innerHTML=`<span class="kk-fb-wrong">✗ 不正解</span><div class="kk-readings-group" style="margin-top:8px">${chips}</div>`;
  }
  kkMark(isRight);
}

/* ── Generic choice checkers ────────────────────────── */
function kkCheckChoice(btn, chosen, correct) {
  if (kk.answered) return; kk.answered=true;
  document.querySelectorAll('.kk-choice-btn').forEach(b=>{
    const v=parseInt(b.textContent);
    if (v===correct) b.classList.add('kk-choice-correct');
    else if (b===btn&&v!==correct) b.classList.add('kk-choice-wrong');
    b.disabled=true;
  });
  kkMark(chosen===correct,true);
}

function kkCheckChoiceStr(btn, chosen, correct) {
  if (kk.answered) return; kk.answered=true;
  document.querySelectorAll('.kk-choice-btn').forEach(b=>{
    const t=b.textContent.trim();
    if (t===correct) b.classList.add('kk-choice-correct');
    else if (b===btn) b.classList.add('kk-choice-wrong');
    b.disabled=true;
  });
  const isRight=chosen===correct;
  if (!isRight&&kk.current.type==='yoji') {
    const item=kk.current;
    const fb=document.createElement('div'); fb.className='kk-feedback';
    fb.innerHTML=`<span class="kk-fb-wrong">✗ 不正解</span>
      <div class="kk-yoji-answer" style="margin-top:8px;font-size:1.8rem">${item.yoji}</div>
      ${item.meaning?`<div class="kk-yoji-meaning" style="margin-top:4px">${item.meaning.split('\n')[0]}</div>`:''}`;
    document.getElementById('kk-question-card')?.appendChild(fb);
  }
  kkMark(isRight,true);
}

function kkReveal(btn) {
  const rev=document.getElementById('kk-reveal'); if (rev) rev.style.display='block'; if (btn) btn.style.display='none';
}

function kkStrokeChoices(correct) {
  const offsets=[-4,-2,-1,1,2,4,6].filter(o=>correct+o>0);
  const wrong=[],pool=[...offsets];
  while (wrong.length<3&&pool.length) { const i=Math.floor(Math.random()*pool.length); wrong.push(correct+pool.splice(i,1)[0]); }
  return kkShuffle([correct,...wrong.slice(0,3)]);
}

/* ── Scoring + advance ──────────────────────────────── */
function kkMark(correct, alreadyHandled=false) {
  if (!alreadyHandled) {
    document.querySelectorAll('.kk-self-check .btn').forEach(b=>b.disabled=true);
    document.querySelectorAll('.kk-type-input').forEach(i=>i.disabled=true);
    document.querySelectorAll('.kk-submit-btn').forEach(b=>b.disabled=true);
  }
  if (correct) kk.score.correct++; else { kk.score.wrong++; if (kk.current) kk.wrongItems.push(kk.current); }
  setTimeout(()=>{ kk.idx++; kkRenderQuestion(); }, !correct ? 2800 : alreadyHandled ? 1000 : 700);
}

function kkNext() { kk.idx++; kkRenderQuestion(); }

/* ── Results ───────────────────────────────────────── */
function kkShowResults() {
  const quizEl=document.getElementById('kk-quiz'); if (!quizEl) return;
  const total=kk.score.correct+kk.score.wrong, pct=total>0?Math.round(kk.score.correct/total*100):0;
  const grade=pct>=80?'合格！':pct>=60?'もう少し':'要復習';
  const gradeClass=pct>=80?'kk-pass':pct>=60?'kk-near':'kk-fail';
  const wrongList=kk.wrongItems.length?`<div class="kk-wrong-list"><div class="kk-label" style="margin-bottom:8px">間違えた問題</div><div class="kk-wrong-chips">${kk.wrongItems.map(item=>`<span class="kk-wrong-chip" title="${item.yoji||''}">${item.kanji||item.yoji||'?'}</span>`).join('')}</div></div>`:'';
  quizEl.innerHTML=`
    <div class="kk-results-inner">
      <div class="kk-results-grade ${gradeClass}">${grade}</div>
      <div class="kk-results-score">${kk.score.correct} <span class="kk-results-denom">/ ${total}</span></div>
      <div class="kk-results-pct">${pct}%</div>
      <div class="kk-results-detail"><span class="kk-correct-count">○ ${kk.score.correct}</span><span class="kk-wrong-count">✗ ${kk.score.wrong}</span></div>
      ${wrongList}
      <div class="kk-results-btns">
        <button class="btn" onclick="kkRestart()" type="button">もう一度</button>
        <button class="btn btn-outline" onclick="kkBackToSetup()" type="button">← 問題選択</button>
      </div>
    </div>`;
}

function kkRestart() { kkStartQuiz(); }
function kkBackToSetup() {
  const s=document.getElementById('kk-setup'), q=document.getElementById('kk-quiz');
  if (s) s.style.display='block'; if (q) q.classList.remove('active');
  kkRenderSetup();
}

/* ── Init ──────────────────────────────────────────── */
function initKanken() {
  kkRenderSetup();
  kkLoadLevels().catch(()=>{});
  kkLoadYoji().catch(()=>{});
}

/* ── Expose ─────────────────────────────────────────── */
window.initKanken=initKanken; window.kkChangeLevel=kkChangeLevel; window.kkSelectSection=kkSelectSection;
window.kkStartQuiz=kkStartQuiz; window.kkMark=kkMark; window.kkNext=kkNext;
window.kkSubmitYomi=kkSubmitYomi; window.kkSubmitOkuri=kkSubmitOkuri; window.kkSubmitTaigi=kkSubmitTaigi;
window.kkKakiClear=kkKakiClear; window.kkKakiSubmit=kkKakiSubmit;
window.kkCheckChoice=kkCheckChoice; window.kkCheckChoiceStr=kkCheckChoiceStr;
window.kkReveal=kkReveal; window.kkRestart=kkRestart; window.kkBackToSetup=kkBackToSetup;
