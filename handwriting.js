/* =========================
   HANDWRITING
========================= */

function hwForceCanvasSize(c){
  if(!c) return;
  // Use attribute size if present, else default
  const aw = parseInt(c.getAttribute('width') || '420', 10);
  const ah = parseInt(c.getAttribute('height') || '350', 10);
  c.width = aw; c.height = ah;
  c.style.width = aw + 'px';
  c.style.height = ah + 'px';
  c.style.touchAction = 'none';
  c.style.pointerEvents = 'auto';
}



/* =========================
   HANDWRITING (2 canvases)
   - Drawing + stroke capture
   - Recognition via Google Input Tools (through your worker)
   - Builds a multi-kanji query + suggests words via Jisho
========================= */

const hwCanvases = [];

const HW_ENDPOINT = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.handwriteEndpoint) || "";
const WORKER_WORDS_HW = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.workerWordsEndpoint) || "https://minireader.zoe-caudron.workers.dev/";

const hw = {
  1: { canvasId: "writing-canvas-1", candidatesId: "hw-candidates-1", statusId: "hw-status-1" },
  2: { canvasId: "writing-canvas-2", candidatesId: "hw-candidates-2", statusId: "hw-status-2" },
};

function hwGetBrush() {
  const sizeEl = document.getElementById("brush-size");
  const colorEl = document.getElementById("brush-color");
  return {
    size: sizeEl ? (+sizeEl.value || 10) : 10,
    color: colorEl ? (colorEl.value || "#1a1410") : "#1a1410",
  };
}

function hwNowMs() { return Math.round(performance.now()); }

function hwInit(){
  try {

  Object.keys(hw).forEach(k => {
    const slot = +k;
    const st = hw[slot];
    st.canvas = document.getElementById(st.canvasId);
    if (st.canvas && !hwCanvases.includes(st.canvas)) hwCanvases.push(st.canvas);
    if (!st.canvas) return;
    st.ctx = st.canvas.getContext("2d");
    st.drawing = false;
    st.lastX = 0;
    st.lastY = 0;
    st.strokes = [];
    st.currentStroke = null;

    // Mouse
    st.canvas.addEventListener("mousedown", (e) => hwStart(slot, e));
    window.addEventListener("mouseup", () => hwEnd(slot));
    st.canvas.addEventListener("mousemove", (e) => hwMove(slot, e));

    // Touch
    st.canvas.addEventListener("touchstart", (e) => hwStart(slot, e), { passive: false });
    st.canvas.addEventListener("touchend", () => hwEnd(slot));
    st.canvas.addEventListener("touchmove", (e) => hwMove(slot, e), { passive: false });
  });

  // Query live suggestions
  const q = document.getElementById("hw-query");
  if (q) q.addEventListener("input", () => hwSuggest());

  hwResizeAll();
  window.addEventListener("resize", hwResizeAll);
  
  setTimeout(hwResizeAll,0);
  } catch(e){ console.error(e); }
// If panel is hidden at load (display:none), resize once after first paint
  setTimeout(hwResizeAll, 0);
}

function hwResizeAll(){
  if (!hwCanvases.length) return;
  hwCanvases.forEach(hwResizeCanvas);
  // redraw grid after resize
  hwCanvases.forEach(c=>{ try{ hwDrawGrid(c); }catch(e){} });
}


function hwDrawGuide(slot) {
  const st = hw[slot];
  if (!st || !st.ctx) return;
  const ctx = st.ctx;
  const w = st.canvas.width, h = st.canvas.height;
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function hwPos(st, e) {
  const r = st.canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return [src.clientX - r.left, src.clientY - r.top];
}

function hwStart(slot, e) {
  const st = hw[slot];
  if (!st) return;
  st.drawing = true;
  const [x, y] = hwPos(st, e);
  st.lastX = x; st.lastY = y;
  st.currentStroke = [{ x, y, t: hwNowMs() }];
  st.strokes.push(st.currentStroke);
  e.preventDefault();
}

function hwEnd(slot) {
  const st = hw[slot];
  if (!st) return;
  st.drawing = false;
  if (st.ctx) st.ctx.beginPath();
}

function hwMove(slot, e) {
  const st = hw[slot];
  if (!st || !st.drawing) return;
  const [x, y] = hwPos(st, e);
  const { size, color } = hwGetBrush();

  st.ctx.globalCompositeOperation = "source-over";
  st.ctx.strokeStyle = color;
  st.ctx.lineWidth = size;
  st.ctx.lineCap = "round";
  st.ctx.lineJoin = "round";

  st.ctx.beginPath();
  st.ctx.moveTo(st.lastX, st.lastY);
  st.ctx.lineTo(x, y);
  st.ctx.stroke();

  st.lastX = x; st.lastY = y;
  if (st.currentStroke) st.currentStroke.push({ x, y, t: hwNowMs() });
  e.preventDefault();
}

function hwClear(slot) {
  const st = hw[slot];
  if (!st) return;
  st.strokes = [];
  st.currentStroke = null;
  st.ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
  hwDrawGuide(slot);
  const cand = document.getElementById(st.candidatesId);
  if (cand) cand.innerHTML = "";
  const status = document.getElementById(st.statusId);
  if (status) status.textContent = "Cleared. Draw again, then Recognize.";
}

function hwClearQuery() {
  const q = document.getElementById("hw-query");
  if (q) q.value = "";
  const out = document.getElementById("hw-word-suggestions");
  if (out) out.innerHTML = '<p class="status-msg">Write kanji (or type) to see word suggestions.</p>';
}

function hwAddToQuery(ch) {
  const q = document.getElementById("hw-query");
  if (!q) return;
  q.value = (q.value || "") + ch;
  hwSuggest();
}

async function hwRecognize(slot) {
  const st = hw[slot];
  if (!st) return;

  const status = document.getElementById(st.statusId);
  const out = document.getElementById(st.candidatesId);

  const usable = (st.strokes || []).filter(s => s && s.length >= 2);
  if (!usable.length) {
    if (status) status.textContent = "Draw a kanji first 🙂";
    if (out) out.innerHTML = "";
    return;
  }

  if (!HW_ENDPOINT) {
    if (status) status.textContent = "Handwriting endpoint not configured.";
    return;
  }

  if (status) status.textContent = "Recognizing…";
  if (out) out.innerHTML = "";

  // Google handwriting payload (via worker), per Input Tools format.
  const ink = usable.map(stroke => ([
    stroke.map(p => Math.round(p.x)),
    stroke.map(p => Math.round(p.y)),
    stroke.map(p => Math.round(p.t || 0)),
  ]));

  const payloadObj = {
    device: navigator.userAgent,
    options: "enable_pre_space",
    requests: [{
      writing_guide: {
        writing_area_width: st.canvas.width,
        writing_area_height: st.canvas.height,
      },
      ink,
      language: "ja",
    }],
  };

  try {
    const r = await fetch(HW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadObj),
    });

    const data = await r.json();
    const cands = hwExtractCandidates(data);

    if (!cands.length) {
      if (status) status.textContent = "No result. Try writing larger / clearer.";
      return;
    }

    if (status) status.textContent = "Click a candidate to add it.";
    hwRenderCandidates(out, cands.slice(0, 12));
  } catch (e) {
    if (status) status.textContent = "Recognition failed (network or worker error).";
  }
}

function hwRenderCandidates(outEl, candidates) {
  if (!outEl) return;
  outEl.innerHTML = "";
  candidates.forEach(ch => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-sm btn-outline";
    b.textContent = ch;
    b.onclick = () => hwAddToQuery(ch);
    outEl.appendChild(b);
  });
}

function hwExtractCandidates(resp) {
  // Google Input Tools responses vary; we try to find a good "string list" anywhere in the structure.
  const out = [];

  const isJP = (s) => typeof s === "string" && /[\u3040-\u30ff\u3400-\u9fff]/.test(s);

  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      // If it's an array of strings, consider it.
      if (node.length && node.every(x => typeof x === "string")) {
        node.forEach(s => { if (isJP(s)) out.push(s); });
      } else {
        node.forEach(walk);
      }
      return;
    }
    if (typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  }

  walk(resp);

  // Prefer single-character kanji candidates if present
  const singles = [...new Set(out)].filter(s => s.length === 1);
  if (singles.length) return singles;

  return [...new Set(out)];
}

let hwSuggestTimer = null;
function hwSuggest() {
  if (hwSuggestTimer) clearTimeout(hwSuggestTimer);
  hwSuggestTimer = setTimeout(async () => {
    const q = document.getElementById("hw-query");
    const out = document.getElementById("hw-word-suggestions");
    if (!q || !out) return;

    const kw = (q.value || "").trim();
    if (!kw) {
      out.innerHTML = '<p class="status-msg">Write kanji (or type) to see word suggestions.</p>';
      return;
    }

    out.innerHTML = '<p class="status-msg">Searching…</p>';
    try {
      const u = new URL(WORKER_WORDS_HW);
      u.searchParams.set('keyword', kw);
      const r = await fetch(u.toString());
      const data = await r.json();
      renderMiniEntries(data.data || [], out);
    } catch {
      out.innerHTML = `<p class="status-msg">Could not reach Jisho. <a href="https://jisho.org/search/${encodeURIComponent(kw)}" target="_blank">Search directly ↗</a></p>`;
    }
  }, 250);
}

function hwLookup() {
  hwSuggest(); // just reuse suggestions container (it already searches)
}

// Minimal renderer (used by handwriting + radicals)
function renderMiniEntries(entries, containerEl) {
  if (!containerEl) return;
  if (!entries || !entries.length) {
    containerEl.innerHTML = '<p class="status-msg">No results found.</p>';
    return;
  }

  const items = entries.slice(0, 8).map(entry => {
    const word = entry.japanese?.[0]?.word || entry.japanese?.[0]?.reading || "";
    const reading = entry.japanese?.[0]?.reading || "";
    const meanings = entry.senses?.[0]?.english_definitions?.slice(0, 3).join("; ") || "";

    return { word, reading, meanings };
  });

  containerEl.innerHTML = "";
  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "mini-row";
    row.innerHTML = `
      <div class="mini-k">${it.word}</div>
      <div class="mini-r">${it.word !== it.reading ? it.reading : ""}</div>
      <div class="mini-m">${it.meanings}</div>
    `;
    row.onclick = () => {
      const inp = document.getElementById("search-input");
      if (inp) inp.value = it.word;
      if (typeof showPanel === "function") showPanel("lookup", document.querySelector("nav button"));
      if (typeof lookupWord === "function") lookupWord();
    };
    containerEl.appendChild(row);
  });

  // Add some minimal styles via inline CSS class hooks (defined in styles.css)
}

window.hwInit = hwInit;
window.hwResizeAll = hwResizeAll;
window.hwClear = hwClear;
window.hwRecognize = hwRecognize;
window.hwLookup = hwLookup;
window.hwClearQuery = hwClearQuery;

document.addEventListener('DOMContentLoaded', hwInit);


function hwSearchWord(){
  const q = (document.getElementById('hw-query')?.value || '').trim();
  if (!q) return;
  const inp = document.getElementById('search-input');
  if (inp) inp.value = q;
  if (typeof showPanel === 'function') showPanel('lookup');
  if (typeof lookupWord === 'function') lookupWord();
}

window.hwInit = hwInit;
window.hwResizeAll = hwResizeAll;
window.hwRecognize = hwRecognize;
window.hwClear = hwClear;
window.hwClearQuery = hwClearQuery;
window.hwSearchWord = hwSearchWord;
