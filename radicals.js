/* =========================
   RADICAL / COMPONENT SEARCH (element2kanji.json)
   - Loads local data/element2kanji.json
   - Click kanji candidates to build multi-kanji query
   - Jisho word suggestions for current query
========================= */

const WORKER_WORDS_R = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.workerWordsEndpoint) || "https://minireader.zoe-caudron.workers.dev/words";

let element2kanji = null;
let elementIndexLoadError = null;

// IMPORTANT: Put file at /data/element2kanji.json (repo root /data folder)
async function loadElementIndex() {
  if (element2kanji) return element2kanji;
  if (elementIndexLoadError) throw elementIndexLoadError;

  const url = new URL("./data/element2kanji.json", window.location.href).toString();
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Could not load element2kanji.json (HTTP ${r.status})`);
    element2kanji = await r.json();
    return element2kanji;
  } catch (e) {
    elementIndexLoadError = e;
    throw e;
  }
}

// Minimal radicals list (you can extend)
const RADICALS = [
  {r:'一',s:1},{r:'丨',s:1},{r:'丶',s:1},{r:'ノ',s:1},{r:'乙',s:1},{r:'亅',s:1},
  {r:'二',s:2},{r:'亠',s:2},{r:'人',s:2},{r:'儿',s:2},{r:'入',s:2},{r:'八',s:2},{r:'冂',s:2},{r:'冖',s:2},{r:'冫',s:2},{r:'几',s:2},{r:'凵',s:2},{r:'刀',s:2},{r:'力',s:2},{r:'勹',s:2},{r:'匕',s:2},{r:'匚',s:2},{r:'十',s:2},{r:'卜',s:2},{r:'卩',s:2},{r:'厂',s:2},{r:'厶',s:2},{r:'又',s:2},
  {r:'口',s:3},{r:'囗',s:3},{r:'土',s:3},{r:'士',s:3},{r:'夕',s:3},{r:'大',s:3},{r:'女',s:3},{r:'子',s:3},{r:'宀',s:3},{r:'寸',s:3},{r:'小',s:3},{r:'山',s:3},{r:'川',s:3},{r:'工',s:3},{r:'己',s:3},{r:'巾',s:3},{r:'广',s:3},{r:'弓',s:3},{r:'彳',s:3},
  {r:'心',s:4},{r:'手',s:4},{r:'文',s:4},{r:'日',s:4},{r:'月',s:4},{r:'木',s:4},{r:'止',s:4},{r:'水',s:4},{r:'火',s:4},{r:'犬',s:4},{r:'王',s:4},{r:'艹',s:4},
];

const strokeCounts = [...new Set(RADICALS.map(r => r.s))].sort((a,b)=>a-b);
let strokeFilter = null;

// shared state from state.js
// selectedRadicals is defined globally in state.js, but guard anyway:
if (typeof window.selectedRadicals === "undefined") window.selectedRadicals = new Set();
const selectedRadicals = window.selectedRadicals;

function renderRadicals() {
  const sf = document.getElementById('stroke-filter');
  if (!sf) return;

  if (!sf.children.length) {
    const allBtn = document.createElement('button');
    allBtn.className = 'stroke-btn active';
    allBtn.textContent = 'All';
    allBtn.onclick = () => { strokeFilter = null; highlightStroke(allBtn); renderRadicalGrid(); };
    sf.appendChild(allBtn);

    strokeCounts.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'stroke-btn';
      btn.textContent = s;
      btn.onclick = () => { strokeFilter = s; highlightStroke(btn); renderRadicalGrid(); };
      sf.appendChild(btn);
    });
  }

  // input listeners
  const q = document.getElementById("radical-query");
  if (q && !q.dataset.bound) {
    q.dataset.bound = "1";
    q.addEventListener("input", () => radicalSuggest());
  }

  renderRadicalGrid();
  updateSelectedDisplay();
}

function highlightStroke(el) {
  document.querySelectorAll('.stroke-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function renderRadicalGrid() {
  const grid = document.getElementById('radical-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const filtered = strokeFilter ? RADICALS.filter(r => r.s === strokeFilter) : RADICALS;

  filtered.forEach(({r, s}) => {
    const btn = document.createElement('button');
    btn.className = 'radical-btn' + (selectedRadicals.has(r) ? ' selected' : '');
    btn.innerHTML = `${r}<span class="strokes">${s}</span>`;
    btn.title = `${r} (${s} strokes)`;
    btn.onclick = () => toggleRadical(r, btn);
    grid.appendChild(btn);
  });
}

function toggleRadical(r, btn) {
  if (selectedRadicals.has(r)) { selectedRadicals.delete(r); btn.classList.remove('selected'); }
  else { selectedRadicals.add(r); btn.classList.add('selected'); }
  updateSelectedDisplay();
}

function updateSelectedDisplay() {
  const disp = document.getElementById('selected-radicals-display');
  if (!disp) return;
  disp.textContent = selectedRadicals.size ? [...selectedRadicals].join(' ') : '—';
}

function clearRadicals() {
  selectedRadicals.clear();
  renderRadicalGrid();
  updateSelectedDisplay();
  const cand = document.getElementById("radical-kanji-candidates");
  if (cand) cand.innerHTML = '<p class="status-msg">Select radicals and click “Get Kanji”.</p>';
}

async function searchByRadicals() {
  const cand = document.getElementById("radical-kanji-candidates");
  if (!selectedRadicals.size) {
    if (cand) cand.innerHTML = '<p class="status-msg">Select at least one radical/component.</p>';
    return;
  }

  if (cand) cand.innerHTML = '<p class="status-msg">Loading element index…</p>';

  let idx;
  try {
    idx = await loadElementIndex();
  } catch (e) {
    if (cand) cand.innerHTML =
      `<p class="status-msg">⚠️ Could not load <code>data/element2kanji.json</code>.<br>
      Ensure it exists at <code>/data/element2kanji.json</code> in your repo.</p>`;
    return;
  }

  const parts = [...selectedRadicals];
  let set = new Set(idx[parts[0]] || []);
  for (let i = 1; i < parts.length; i++) {
    const next = new Set(idx[parts[i]] || []);
    set = new Set([...set].filter(k => next.has(k)));
  }

  const chars = [...set].slice(0, 240);
  renderKanjiCandidates(chars);
}

function renderKanjiCandidates(chars) {
  const cand = document.getElementById("radical-kanji-candidates");
  if (!cand) return;

  if (!chars.length) {
    cand.innerHTML = '<p class="status-msg">No candidates. Try fewer/different parts.</p>';
    return;
  }

  cand.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${chars.map(k => `
        <button class="btn btn-sm btn-outline"
          style="font-family:'Noto Serif JP',serif;font-size:1.15rem"
          onclick="radicalAppend('${k}')">${k}</button>
      `).join('')}
    </div>
    <p class="status-msg" style="margin-top:10px">Click kanji to build a word.</p>
  `;
}

function radicalAppend(kanji) {
  const inp = document.getElementById("radical-query");
  if (!inp) return;
  inp.value = (inp.value || "") + kanji;
  radicalSuggest();
}

async function radicalSuggest() {
  const box = document.getElementById("radical-word-suggestions");
  const q = document.getElementById("radical-query")?.value?.trim() || "";
  if (!box) return;

  if (!q) {
    box.innerHTML = '<p class="status-msg">Build a query to see suggestions.</p>';
    return;
  }

  box.innerHTML = '<p class="status-msg">Suggestions…</p>';
  try {
    const r = await fetch(JISHO_API_R + encodeURIComponent(q));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const entries = (data.data || []).slice(0, 6);
    if (!entries.length) { box.innerHTML = '<p class="status-msg">No suggestions.</p>'; return; }

    box.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${entries.map(e => {
          const w = e.japanese[0]?.word || e.japanese[0]?.reading || '';
          const rd = e.japanese[0]?.reading || '';
          const m = e.senses[0]?.english_definitions?.slice(0,2).join('; ') || '';
          return `<button class="btn btn-sm btn-outline" style="text-align:left"
            onclick="document.getElementById('search-input').value='${w}'; showPanel('lookup'); lookupWord('${w}')">
            <span style="font-family:'Noto Serif JP',serif;font-weight:600">${escapeHtml(w)}</span>
            <span style="opacity:0.7;margin-left:8px">${escapeHtml(w!==rd?rd:'')}</span>
            <span style="opacity:0.75;margin-left:10px">— ${escapeHtml(m)}</span>
          </button>`;
        }).join('')}
      </div>`;
  } catch (e) {
    box.innerHTML = '<p class="status-msg">Could not load suggestions.</p>';
  }
}

function radicalSearchWord() {
  const q = document.getElementById("radical-query")?.value?.trim() || "";
  if (!q) return;
  document.getElementById("search-input").value = q;
  showPanel("lookup");
  lookupWord(q);
}

function radicalClearAll() {
  const inp = document.getElementById("radical-query");
  if (inp) inp.value = "";
  const box = document.getElementById("radical-word-suggestions");
  if (box) box.innerHTML = '<p class="status-msg">Build a query to see suggestions.</p>';
  const cand = document.getElementById("radical-kanji-candidates");
  if (cand) cand.innerHTML = '<p class="status-msg">Select radicals and click “Get Kanji”.</p>';
  clearRadicals();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// expose for HTML onclick
window.renderRadicals = renderRadicals;
window.searchByRadicals = searchByRadicals;
window.clearRadicals = clearRadicals;
window.radicalAppend = radicalAppend;
window.radicalSearchWord = radicalSearchWord;
window.radicalClearAll = radicalClearAll;

document.addEventListener('DOMContentLoaded', ()=>{ try{ renderRadicals(); }catch(e){console.error(e);} });
