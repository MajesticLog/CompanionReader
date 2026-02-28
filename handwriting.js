/* =========================
   HANDWRITING (Canvas → Google Input Tools via Worker)
   Targets existing markup in your index.html:
     canvas#writng-canvas
     input#brush-size, input#brush-color
     div#hw-status, div#hw-candidates, div#hw-word-suggestions
   Global functions used by buttons:
     clearCanvas(), hwRecognize()
========================= */

const HW_WORKER = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.handwriteEndpoint)
  || "https://minireader.zoe-caudron.workers.dev/handwrite";

const HW_WORDS = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.workerWordsEndpoint)
  || "https://minireader.zoe-caudron.workers.dev/words";

function hwWordsUrl(keyword){
  const u = new URL(HW_WORDS);
  u.searchParams.set("keyword", keyword);
  return u.toString();
}

let hw = {
  canvas: null,
  ctx: null,
  drawing: false,
  last: null,
  strokes: [],        // array of strokes; each stroke: {xs:[], ys:[], ts:[]}
  current: null,
  dpr: 1,
};

function $(id){ return document.getElementById(id); }

function setStatus(msg){
  const el = $("hw-status");
  if (el) el.textContent = msg;
}

function clearCandidates(){
  const c = $("hw-candidates"); if (c) c.innerHTML = "";
  const w = $("hw-word-suggestions"); if (w) w.innerHTML = "";
}

function hwForceCanvasSize(){
  if (!hw.canvas) return;
  const canvas = hw.canvas;
  const parent = canvas.parentElement;
  const cssW = Math.min(520, Math.max(260, parent ? parent.clientWidth : canvas.width));
  const cssH = Math.round(cssW * 0.78);

  hw.dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.round(cssW * hw.dpr);
  canvas.height = Math.round(cssH * hw.dpr);

  hw.ctx.setTransform(hw.dpr, 0, 0, hw.dpr, 0, 0);
  drawHwGrid();
}

function drawHwGrid(){
  if (!hw.ctx || !hw.canvas) return;
  const ctx = hw.ctx;
  const w = hw.canvas.width / hw.dpr;
  const h = hw.canvas.height / hw.dpr;

  // clear
  ctx.clearRect(0, 0, w, h);

  // subtle guides
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6,6]);
  ctx.beginPath();
  ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
  ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
  ctx.moveTo(0, 0); ctx.lineTo(w, h);
  ctx.moveTo(w, 0); ctx.lineTo(0, h);
  ctx.stroke();
  ctx.restore();

  // redraw ink from strokes
  redrawInk();
}

function redrawInk(){
  const ctx = hw.ctx;
  if (!ctx) return;

  const color = ($("brush-color") && $("brush-color").value) || "#1a1410";
  const size = ($("brush-size") && +$("brush-size").value) || 6;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const s of hw.strokes){
    if (!s.xs.length) continue;
    ctx.beginPath();
    ctx.moveTo(s.xs[0], s.ys[0]);
    for (let i=1;i<s.xs.length;i++){
      ctx.lineTo(s.xs[i], s.ys[i]);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function posFromEvent(e){
  const r = hw.canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - r.left, y: src.clientY - r.top };
}

function startDraw(e){
  if (!hw.canvas) return;
  hw.drawing = true;
  const p = posFromEvent(e);
  hw.current = { xs:[p.x], ys:[p.y], ts:[0] };
  hw.strokes.push(hw.current);
  hw.last = p;
  e.preventDefault();
}
function endDraw(){
  hw.drawing = false;
  hw.last = null;
  hw.current = null;
}
function drawMove(e){
  if (!hw.drawing || !hw.current) return;
  const p = posFromEvent(e);

  const ctx = hw.ctx;
  const color = ($("brush-color") && $("brush-color").value) || "#1a1410";
  const size = ($("brush-size") && +$("brush-size").value) || 6;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(hw.last.x, hw.last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.restore();

  hw.current.xs.push(p.x);
  hw.current.ys.push(p.y);
  hw.current.ts.push(hw.current.ts.length ? hw.current.ts[hw.current.ts.length-1] + 16 : 0);

  hw.last = p;
  e.preventDefault();
}

function buildInkPayload(){
  const canvas = hw.canvas;
  const w = canvas.width / hw.dpr;
  const h = canvas.height / hw.dpr;

  // Convert to InputTools ink format: [ [x...], [y...], [t...] ] per stroke
  const ink = hw.strokes
    .filter(s => s.xs.length >= 2)
    .map(s => [s.xs.map(n=>Math.round(n)), s.ys.map(n=>Math.round(n)), s.ts]);

  return {
    app_version: 0.4,
    api_level: "537.36",
    device: "Mozilla/5.0",
    input_type: 0,
    options: "enable_pre_space",
    requests: [{
      language: "ja",
      writing_guide: { writing_area_width: Math.round(w), writing_area_height: Math.round(h) },
      ink
    }]
  };
}

async function hwRecognize(){
  if (!hw.strokes.length) { setStatus("Draw something first."); return; }

  setStatus("Recognizing…");
  clearCandidates();

  const payload = buildInkPayload();
  if (!payload.requests[0].ink.length) { setStatus("Try writing larger / clearer."); return; }

  let respText = "";
  try {
    const r = await fetch(HW_WORKER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    respText = await r.text();
    if (!r.ok) throw new Error("HTTP " + r.status + " " + respText.slice(0,120));
  } catch (e) {
    console.error(e);
    setStatus("Could not reach handwriting service.");
    return;
  }

  let data;
  try { data = JSON.parse(respText); } catch { data = respText; }

  // Expected: ["SUCCESS",[["候補1","候補2",...], ...], ...]
  let candidates = [];
  if (Array.isArray(data) && data[0] === "SUCCESS") {
    const blocks = data[1];
    if (Array.isArray(blocks) && blocks[0] && Array.isArray(blocks[0][1])) {
      candidates = blocks[0][1];
    } else if (Array.isArray(blocks) && Array.isArray(blocks[0])) {
      // sometimes blocks[0] is itself a list of strings
      candidates = blocks[0].filter(x=>typeof x==="string");
    }
  }

  if (!candidates.length) {
    setStatus("No result. Try writing larger / clearer.");
    return;
  }

  setStatus("Click a candidate to add it to your search.");
  renderCandidates(candidates.slice(0, 12));
}

function renderCandidates(list){
  const wrap = $("hw-candidates");
  if (!wrap) return;

  wrap.innerHTML = `
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
      ${list.map(k => `<button type="button" class="btn btn-sm btn-outline" data-k="${escapeHTML(k)}">${escapeHTML(k)}</button>`).join("")}
    </div>
  `;

  wrap.querySelectorAll("button[data-k]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const k = btn.getAttribute("data-k") || "";
      const inp = document.getElementById("search-input");
      if (inp) inp.value = (inp.value || "") + k;
      // show suggestions for the built string
      hwSuggestWords((inp && inp.value) || k);
    });
  });
}

async function hwSuggestWords(q){
  const out = $("hw-word-suggestions");
  if (!out) return;
  if (!q) { out.innerHTML = ""; return; }

  out.innerHTML = `<p class="status-msg">Looking up “${escapeHTML(q)}”…</p>`;
  try {
    const r = await fetch(hwWordsUrl(q));
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    const entries = (data && data.data) || [];
    if (!entries.length) {
      out.innerHTML = `<p class="status-msg">No word suggestions yet. You can still search with the main Search button.</p>`;
      return;
    }
    out.innerHTML = `
      <div style="margin-top:10px">
        <div class="tags">Suggestions</div>
        ${entries.slice(0,6).map(e=>{
          const w = e.japanese?.[0]?.word || e.japanese?.[0]?.reading || "";
          const r0 = e.japanese?.[0]?.reading || "";
          const m = e.senses?.[0]?.english_definitions?.slice(0,2).join("; ") || "";
          return `<div class="result-entry" style="padding:10px 0">
            <div class="word-header">
              <span class="kanji-large">${escapeHTML(w)}</span>
              <span class="reading">${escapeHTML(w!==r0 ? r0 : "")}</span>
            </div>
            <div class="meanings">${escapeHTML(m)}</div>
            <div class="add-btn">
              <button type="button" class="btn btn-sm" data-search="${escapeHTML(w)}">Search</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    `;
    out.querySelectorAll("button[data-search]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const w = b.getAttribute("data-search") || "";
        const inp = document.getElementById("search-input");
        if (inp) inp.value = w;
        if (typeof showPanel === "function") showPanel("lookup");
        if (typeof lookupWord === "function") lookupWord();
      });
    });
  } catch(e){
    console.error(e);
    out.innerHTML = `<p class="status-msg">Could not fetch word suggestions.</p>`;
  }
}

function clearCanvas(redrawGrid = true){
  hw.strokes = [];
  hw.current = null;
  hw.drawing = false;
  clearCandidates();
  setStatus("Draw a kanji, then click Recognize.");
  if (redrawGrid) drawHwGrid();
}

function hwResizeAll(){
  // single canvas
  if (!hw.canvas) return;
  // only resize when visible (has width)
  const r = hw.canvas.getBoundingClientRect();
  if (r.width > 0) hwForceCanvasSize();
}

function hwInit(){
  const canvas = document.getElementById("writing-canvas");
  if (!canvas) return;

  hw.canvas = canvas;
  hw.ctx = canvas.getContext("2d");

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", drawMove);
  window.addEventListener("mouseup", endDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", drawMove, { passive: false });
  window.addEventListener("touchend", endDraw, { passive: false });

  hwForceCanvasSize();
  clearCanvas(true);
}

window.hwInit = hwInit;
window.hwResizeAll = hwResizeAll;
window.hwRecognize = hwRecognize;
window.clearCanvas = clearCanvas;

// init once
document.addEventListener("DOMContentLoaded", hwInit);
