/* =========================
   RADICALS → Kanji suggestions using element2kanji.json
   Works with existing markup from your index.html:
     #stroke-filter, #radical-grid, #selected-radicals-display, #radical-results
   It will render:
     - candidate kanji buttons
     - a small "word builder" input inside #radical-results
     - word suggestions via Jisho when you click Search
========================= */

const ELEMENT2KANJI_URL = "./element2kanji.json"; // place file at site root (same folder as index.html)

const RAD_WORKER_WORDS = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.workerWordsEndpoint)
  || "https://minireader.zoe-caudron.workers.dev/words";

function radWordsUrl(keyword){
  const u = new URL(RAD_WORKER_WORDS);
  u.searchParams.set("keyword", keyword);
  return u.toString();
}

let elementIndex = null; // { elementChar: [kanji...] }
let selectedElements = new Set();
let strokeFilter = null;

function $(id){ return document.getElementById(id); }

async function loadElementIndex(){
  if (elementIndex) return elementIndex;
  try {
    const r = await fetch(ELEMENT2KANJI_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP "+r.status);
    elementIndex = await r.json();
    return elementIndex;
  } catch(e){
    console.error("Failed to load element2kanji.json", e);
    elementIndex = {};
    return elementIndex;
  }
}

/* Minimal radical list (you can expand later). Stroke counts used for filter UI. */
const RADICALS = [
  {r:'一',s:1},{r:'丨',s:1},{r:'丶',s:1},{r:'ノ',s:1},{r:'乙',s:1},{r:'亅',s:1},
  {r:'二',s:2},{r:'亠',s:2},{r:'人',s:2},{r:'儿',s:2},{r:'入',s:2},{r:'八',s:2},{r:'冂',s:2},{r:'冖',s:2},{r:'冫',s:2},{r:'几',s:2},{r:'凵',s:2},{r:'刀',s:2},{r:'力',s:2},{r:'勹',s:2},{r:'匕',s:2},{r:'匚',s:2},{r:'十',s:2},{r:'卜',s:2},{r:'卩',s:2},{r:'厂',s:2},{r:'厶',s:2},{r:'又',s:2},
  {r:'口',s:3},{r:'囗',s:3},{r:'土',s:3},{r:'士',s:3},{r:'夂',s:3},{r:'夕',s:3},{r:'大',s:3},{r:'女',s:3},{r:'子',s:3},{r:'宀',s:3},{r:'寸',s:3},{r:'小',s:3},{r:'尸',s:3},{r:'山',s:3},{r:'川',s:3},{r:'工',s:3},{r:'己',s:3},{r:'巾',s:3},{r:'广',s:3},{r:'廴',s:3},{r:'弓',s:3},{r:'彳',s:3},
  {r:'心',s:4},{r:'日',s:4},{r:'月',s:4},{r:'木',s:4},{r:'水',s:4},{r:'火',s:4},{r:'犬',s:4},{r:'王',s:4},
];

function renderRadicals(){
  const sf = $("stroke-filter");
  const grid = $("radical-grid");
  if (!sf || !grid) return;

  // render stroke filter once
  if (!sf.dataset.ready) {
    const strokeCounts = [...new Set(RADICALS.map(x=>x.s))].sort((a,b)=>a-b);
    sf.innerHTML = "";
    const all = document.createElement("button");
    all.className = "stroke-btn active";
    all.textContent = "All";
    all.onclick = () => { strokeFilter = null; highlightStroke(all); renderRadicalGrid(); };
    sf.appendChild(all);
    strokeCounts.forEach(s=>{
      const b = document.createElement("button");
      b.className = "stroke-btn";
      b.textContent = String(s);
      b.onclick = () => { strokeFilter = s; highlightStroke(b); renderRadicalGrid(); };
      sf.appendChild(b);
    });
    sf.dataset.ready = "1";
  }

  renderRadicalGrid();
  updateSelectedDisplay();
  ensureResultsShell();
}

function highlightStroke(el){
  document.querySelectorAll(".stroke-btn").forEach(b=>b.classList.remove("active"));
  el.classList.add("active");
}

function renderRadicalGrid(){
  const grid = $("radical-grid");
  if (!grid) return;

  grid.innerHTML = "";
  const filtered = strokeFilter ? RADICALS.filter(x=>x.s===strokeFilter) : RADICALS;

  filtered.forEach(({r,s})=>{
    const btn = document.createElement("button");
    btn.className = "radical-btn" + (selectedElements.has(r) ? " selected" : "");
    btn.innerHTML = `${escapeHTML(r)}<span class="strokes">${s}</span>`;
    btn.title = `${r} (${s})`;
    btn.onclick = () => {
      if (selectedElements.has(r)) selectedElements.delete(r);
      else selectedElements.add(r);
      btn.classList.toggle("selected");
      updateSelectedDisplay();
      // live update candidates when selection changes
      searchByRadicals();
    };
    grid.appendChild(btn);
  });
}

function updateSelectedDisplay(){
  const disp = $("selected-radicals-display");
  if (!disp) return;
  disp.textContent = selectedElements.size ? [...selectedElements].join(" ") : "—";
}

function clearRadicals(){
  selectedElements.clear();
  renderRadicalGrid();
  updateSelectedDisplay();
  const res = $("radical-results");
  if (res) res.innerHTML = `<p class="status-msg">Select radicals and click Search.</p>`;
}

function ensureResultsShell(){
  const res = $("radical-results");
  if (!res) return;
  if (res.dataset.shell) return;
  res.dataset.shell = "1";
  res.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <input id="radical-word" type="text" placeholder="Build a word…" style="flex:1;min-width:160px;padding:8px 10px;border:1px solid var(--border);background:var(--paper);border-radius:25px;outline:none;font-family:'Noto Serif JP',serif">
      <button class="btn btn-sm" type="button" id="radical-search-btn">Search</button>
      <button class="btn btn-sm btn-outline" type="button" id="radical-clear-btn">Clear</button>
    </div>
    <div id="radical-kanji-candidates"></div>
    <div id="radical-word-suggestions"></div>
    <p class="status-msg" style="margin-top:8px">Pick parts; click kanji candidates to build a word.</p>
  `;
  $("radical-search-btn")?.addEventListener("click", ()=> {
    const q = $("radical-word")?.value?.trim() || "";
    if (!q) return;
    if (typeof showPanel === "function") showPanel("lookup");
    const inp = document.getElementById("search-input");
    if (inp) inp.value = q;
    if (typeof lookupWord === "function") lookupWord();
  });
  $("radical-clear-btn")?.addEventListener("click", ()=>{
    const inp = $("radical-word"); if (inp) inp.value = "";
    $("radical-word-suggestions").innerHTML = "";
  });
}

function setWordBuilderAppend(ch){
  const inp = $("radical-word");
  if (!inp) return;
  inp.value = (inp.value || "") + ch;
  radSuggestWords(inp.value);
}

async function searchByRadicals(){
  ensureResultsShell();

  const candWrap = $("radical-kanji-candidates");
  const suggestions = $("radical-word-suggestions");

  if (!candWrap) return;

  if (!selectedElements.size){
    candWrap.innerHTML = "";
    if (suggestions) suggestions.innerHTML = "";
    return;
  }

  candWrap.innerHTML = `<p class="status-msg">Loading candidates…</p>`;

  const idx = await loadElementIndex();

  // intersection of kanji lists
  let set = null;
  for (const el of selectedElements){
    const list = idx[el] || [];
    const s = new Set(list);
    set = set ? new Set([...set].filter(x=>s.has(x))) : s;
    if (set.size === 0) break;
  }

  const candidates = set ? [...set].slice(0, 80) : [];
  if (!candidates.length){
    candWrap.innerHTML = `<p class="status-msg">No candidates. Try fewer / different parts (or handwriting).</p>`;
    return;
  }

  candWrap.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${candidates.map(k=>`<button type="button" class="btn btn-sm btn-outline" data-k="${escapeHTML(k)}">${escapeHTML(k)}</button>`).join("")}
    </div>
  `;

  candWrap.querySelectorAll("button[data-k]").forEach(b=>{
    b.addEventListener("click", ()=> setWordBuilderAppend(b.getAttribute("data-k") || ""));
  });
}

async function radSuggestWords(q){
  const out = $("radical-word-suggestions");
  if (!out) return;
  if (!q) { out.innerHTML = ""; return; }

  out.innerHTML = `<p class="status-msg">Suggestions for “${escapeHTML(q)}”…</p>`;
  try{
    const r = await fetch(radWordsUrl(q));
    if (!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();
    const entries = (data && data.data) || [];
    if (!entries.length){
      out.innerHTML = `<p class="status-msg">No suggestions yet. You can still Search.</p>`;
      return;
    }
    out.innerHTML = `
      <div style="margin-top:10px">
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
    out.innerHTML = `<p class="status-msg">Could not fetch suggestions.</p>`;
  }
}

window.renderRadicals = renderRadicals;
window.searchByRadicals = searchByRadicals;
window.clearRadicals = clearRadicals;

document.addEventListener("DOMContentLoaded", renderRadicals);
