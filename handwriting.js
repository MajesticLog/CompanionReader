/* =========================
   HANDWRITING
========================= */

const hwCanvases = [];

const HW_ENDPOINT = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.handwriteEndpoint) || "";
const WORKER_WORDS_HW = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.jishoApi)
  || "https://minireader.zoe-caudron.workers.dev/?keyword=";

const hw = {
  1: { canvasId: "writing-canvas-1", candidatesId: "hw-candidates-1", statusId: "hw-status-1" },
  2: { canvasId: "writing-canvas-2", candidatesId: "hw-candidates-2", statusId: "hw-status-2" },
};

function hwGetBrush() {
  return {
    size:  +(document.getElementById("brush-size")?.value  || 10),
    color:   document.getElementById("brush-color")?.value || "#1a1410",
  };
}

function hwNowMs() { return Math.round(performance.now()); }

/* ── Resize a single canvas to fill its CSS layout box ── */
function hwResizeCanvas(canvas) {
  if (!canvas) return;
  const wrap = canvas.parentElement;
  // Use the card width minus padding; fall back to fixed size
  const w = Math.max(200, (wrap ? wrap.clientWidth - 48 : 0) || parseInt(canvas.getAttribute('width') || '420'));
  const h = parseInt(canvas.getAttribute('height') || '350');
  if (canvas.width === w && canvas.height === h) return; // no change needed
  canvas.width  = w;
  canvas.height = h;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
}

/* ── Draw cross-hair guide lines ── */
function hwDrawGrid(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.strokeStyle = 'rgba(100,100,100,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function hwResizeAll() {
  if (!hwCanvases.length) return;
  hwCanvases.forEach(hwResizeCanvas);
  hwCanvases.forEach(hwDrawGrid);
}

/* ── Accurate pointer position relative to canvas ──
   getBoundingClientRect gives viewport-relative coords.
   We divide by the CSS-to-pixel ratio in case the canvas
   is scaled (width attribute ≠ CSS pixel width).          */
function hwPos(st, e) {
  const canvas = st.canvas;
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;

  // Scale factor: canvas drawing pixels vs CSS pixels
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;

  return [
    (src.clientX - rect.left) * scaleX,
    (src.clientY - rect.top)  * scaleY,
  ];
}

function hwInit() {
  try {
    Object.keys(hw).forEach(k => {
      const slot = +k;
      const st = hw[slot];
      st.canvas = document.getElementById(st.canvasId);
      if (st.canvas && !hwCanvases.includes(st.canvas)) hwCanvases.push(st.canvas);
      if (!st.canvas) return;

      st.canvas.style.touchAction  = 'none';
      st.canvas.style.pointerEvents = 'auto';
      st.ctx = st.canvas.getContext('2d');
      st.drawing = false;
      st.strokes = [];
      st.currentStroke = null;

      // Mouse events
      st.canvas.addEventListener('mousedown',  e => hwStart(slot, e));
      st.canvas.addEventListener('mousemove',  e => hwMove(slot, e));
      st.canvas.addEventListener('mouseup',    ()  => hwEnd(slot));
      st.canvas.addEventListener('mouseleave', ()  => hwEnd(slot));

      // Touch events
      st.canvas.addEventListener('touchstart', e => hwStart(slot, e), { passive: false });
      st.canvas.addEventListener('touchmove',  e => hwMove(slot, e),  { passive: false });
      st.canvas.addEventListener('touchend',   ()  => hwEnd(slot));
    });

    const q = document.getElementById('hw-query');
    if (q) q.addEventListener('input', () => hwSuggest());

    // Size canvases and draw guides
    hwResizeAll();
    window.addEventListener('resize', hwResizeAll);

    // Re-run after first paint in case panel was display:none at load
    requestAnimationFrame(() => { hwResizeAll(); });
  } catch (e) {
    console.error('[hwInit]', e);
  }
}

function hwStart(slot, e) {
  const st = hw[slot];
  if (!st) return;
  e.preventDefault();
  st.drawing = true;
  const [x, y] = hwPos(st, e);
  st.lastX = x; st.lastY = y;
  st.currentStroke = [{ x, y, t: hwNowMs() }];
  st.strokes.push(st.currentStroke);
}

function hwEnd(slot) {
  const st = hw[slot];
  if (!st || !st.drawing) return;
  st.drawing = false;
  st.ctx.beginPath(); // reset path so next stroke starts fresh
}

function hwMove(slot, e) {
  const st = hw[slot];
  if (!st || !st.drawing) return;
  e.preventDefault();

  const [x, y] = hwPos(st, e);
  const { size, color } = hwGetBrush();

  st.ctx.globalCompositeOperation = 'source-over';
  st.ctx.strokeStyle = color;
  st.ctx.lineWidth   = size;
  st.ctx.lineCap     = 'round';
  st.ctx.lineJoin    = 'round';

  st.ctx.beginPath();
  st.ctx.moveTo(st.lastX, st.lastY);
  st.ctx.lineTo(x, y);
  st.ctx.stroke();

  st.lastX = x; st.lastY = y;
  if (st.currentStroke) st.currentStroke.push({ x, y, t: hwNowMs() });
}

function hwClear(slot) {
  const st = hw[slot];
  if (!st || !st.canvas) return;
  st.strokes = [];
  st.currentStroke = null;
  st.ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
  hwDrawGrid(st.canvas);
  const cand = document.getElementById(st.candidatesId);
  if (cand) cand.innerHTML = '';
  const status = document.getElementById(st.statusId);
  if (status) status.textContent = 'Cleared. Draw again, then Recognize.';
}

function hwClearQuery() {
  const q = document.getElementById('hw-query');
  if (q) q.value = '';
  const out = document.getElementById('hw-word-suggestions');
  if (out) out.innerHTML = '<p class="status-msg">Write kanji (or type) to see word suggestions.</p>';
}

function hwAddToQuery(ch) {
  const q = document.getElementById('hw-query');
  if (!q) return;
  q.value = (q.value || '') + ch;
  hwSuggest();
}

async function hwRecognize(slot) {
  const st = hw[slot];
  if (!st) return;
  const status = document.getElementById(st.statusId);
  const out    = document.getElementById(st.candidatesId);

  const usable = (st.strokes || []).filter(s => s && s.length >= 2);
  if (!usable.length) {
    if (status) status.textContent = 'Draw a kanji first 🙂';
    if (out) out.innerHTML = '';
    return;
  }
  if (!HW_ENDPOINT) {
    if (status) status.textContent = 'Handwriting endpoint not configured.';
    return;
  }

  if (status) status.textContent = 'Recognizing…';
  if (out) out.innerHTML = '';

  const ink = usable.map(stroke => ([
    stroke.map(p => Math.round(p.x)),
    stroke.map(p => Math.round(p.y)),
    stroke.map(p => Math.round(p.t || 0)),
  ]));

  const payload = {
    device: navigator.userAgent,
    options: 'enable_pre_space',
    requests: [{
      writing_guide: {
        writing_area_width:  st.canvas.width,
        writing_area_height: st.canvas.height,
      },
      ink,
      language: 'ja',
    }],
  };

  try {
    const r = await fetch(HW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    const cands = hwExtractCandidates(data);
    if (!cands.length) {
      if (status) status.textContent = 'No result. Try writing larger / clearer.';
      return;
    }
    if (status) status.textContent = 'Click a candidate to add it.';
    hwRenderCandidates(out, cands.slice(0, 12));
  } catch (err) {
    if (status) status.textContent = 'Recognition failed (network or worker error).';
    console.error('[hwRecognize]', err);
  }
}

function hwExtractCandidates(resp) {
  const out = [];
  const isJP = s => typeof s === 'string' && /[\u3040-\u30ff\u3400-\u9fff]/.test(s);
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      if (node.length && node.every(x => typeof x === 'string')) {
        node.forEach(s => { if (isJP(s)) out.push(s); });
      } else { node.forEach(walk); }
      return;
    }
    if (typeof node === 'object') Object.values(node).forEach(walk);
  }
  walk(resp);
  const singles = [...new Set(out)].filter(s => s.length === 1);
  return singles.length ? singles : [...new Set(out)];
}

function hwRenderCandidates(outEl, candidates) {
  if (!outEl) return;
  outEl.innerHTML = '';
  candidates.forEach(ch => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm btn-outline';
    b.style.fontFamily = "'Kosugi Maru', sans-serif";
    b.style.fontSize = '1.1rem';
    b.textContent = ch;
    b.onclick = () => hwAddToQuery(ch);
    outEl.appendChild(b);
  });
}

let hwSuggestTimer = null;
function hwSuggest() {
  clearTimeout(hwSuggestTimer);
  hwSuggestTimer = setTimeout(async () => {
    const q   = document.getElementById('hw-query');
    const out = document.getElementById('hw-word-suggestions');
    if (!q || !out) return;
    const kw = (q.value || '').trim();
    if (!kw) {
      out.innerHTML = '<p class="status-msg">Write kanji (or type) to see word suggestions.</p>';
      return;
    }
    out.innerHTML = '<p class="status-msg">Searching…</p>';
    try {
      const url = WORKER_WORDS_HW + encodeURIComponent(kw);
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      renderMiniEntries(data.data || [], out);
    } catch {
      out.innerHTML = `<p class="status-msg">Could not load suggestions. <a href="https://jisho.org/search/${encodeURIComponent(kw)}" target="_blank">jisho.org ↗</a></p>`;
    }
  }, 250);
}

function hwLookup() { hwSuggest(); }

function hwSearchWord() {
  const q = (document.getElementById('hw-query')?.value || '').trim();
  if (!q) return;
  const inp = document.getElementById('search-input');
  if (inp) inp.value = q;
  if (typeof showPanel === 'function') showPanel('lookup');
  if (typeof lookupWord === 'function') lookupWord();
}

function renderMiniEntries(entries, containerEl) {
  if (!containerEl) return;
  if (!entries || !entries.length) {
    containerEl.innerHTML = '<p class="status-msg">No results found.</p>';
    return;
  }
  containerEl.innerHTML = '';
  entries.slice(0, 8).forEach(entry => {
    const word    = entry.japanese?.[0]?.word    || entry.japanese?.[0]?.reading || '';
    const reading = entry.japanese?.[0]?.reading || '';
    const meanings = entry.senses?.[0]?.english_definitions?.slice(0, 3).join('; ') || '';
    const row = document.createElement('div');
    row.className = 'mini-row';
    row.innerHTML = `
      <div class="mini-k">${word}</div>
      <div class="mini-r">${word !== reading ? reading : ''}</div>
      <div class="mini-m">${meanings}</div>`;
    row.onclick = () => {
      const inp = document.getElementById('search-input');
      if (inp) inp.value = word;
      if (typeof showPanel  === 'function') showPanel('lookup', document.querySelector('nav button'));
      if (typeof lookupWord === 'function') lookupWord();
    };
    containerEl.appendChild(row);
  });
}

window.hwInit       = hwInit;
window.hwResizeAll  = hwResizeAll;
window.hwClear      = hwClear;
window.hwRecognize  = hwRecognize;
window.hwLookup     = hwLookup;
window.hwClearQuery = hwClearQuery;
window.hwSearchWord = hwSearchWord;

document.addEventListener('DOMContentLoaded', hwInit);
