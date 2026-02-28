/* =========================
   LOOKUP (via Worker proxy to avoid CORS)
========================= */

const WORKER_WORDS = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.workerWordsEndpoint)
  || "https://minireader.zoe-caudron.workers.dev/";

function workerUrl(keyword){
  const u = new URL(WORKER_WORDS);
  u.searchParams.set("keyword", keyword);
  return u.toString();
}

document.getElementById('search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupWord();
});

async function lookupWord() {
  const q = (document.getElementById('search-input')?.value || '').trim();
  if (!q) return;
  const res = document.getElementById('results');
  if (!res) return;
  res.innerHTML = '<p class="status-msg">Searching…</p>';

  try {
    const r = await fetch(workerUrl(q), { method: "GET" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    renderResults(data.data || []);
  } catch (e) {
    res.innerHTML = `<p class="status-msg">⚠️ Could not reach dictionary. Try searching directly: <a href="https://jisho.org/search/${encodeURIComponent(q)}" target="_blank" style="color:var(--red)">jisho.org ↗</a></p>`;
    console.error(e);
  }
}

function renderResults(entries) {
  const res = document.getElementById('results');
  if (!res) return;
  if (!entries.length) { res.innerHTML = '<p class="status-msg">No results found.</p>'; return; }
  res.innerHTML = '';
  entries.slice(0, 8).forEach(entry => {
    const word = entry.japanese?.[0]?.word || entry.japanese?.[0]?.reading || '';
    const reading = entry.japanese?.[0]?.reading || '';
    const meanings = entry.senses?.[0]?.english_definitions?.join('; ') || '';
    const tags = [...(entry.senses?.[0]?.parts_of_speech || [])].slice(0,2).join(', ');
    const jlpt = entry.jlpt?.[0] || '';

    const div = document.createElement('div');
    div.className = 'result-entry';
    div.innerHTML = `
      <div class="word-header">
        <span class="kanji-large">${word}</span>
        <span class="reading">${word !== reading ? reading : ''}</span>
        ${jlpt ? `<span class="jlpt-badge">${jlpt.toUpperCase()}</span>` : ''}
      </div>
      <div class="meanings">${meanings}</div>
      ${tags ? `<div class="tags">${tags}</div>` : ''}
      <div class="add-btn">
        <select id="bk-${sanitize(word)}" style="max-width:160px">
          ${(window.books||[]).map(b => `<option value="${b.id}">${b.title}</option>`).join('')}
          ${(window.books||[]).length === 0 ? '<option disabled>No books yet</option>' : ''}
        </select>
        <button class="btn btn-sm" type="button" onclick='addToBook(${JSON.stringify(word)}, ${JSON.stringify(reading)}, ${JSON.stringify(meanings)}, "bk-${sanitize(word)}")'>+ Add to List</button>
      </div>`;
    res.appendChild(div);
  });
}

function sanitize(s) { return (s||'').replace(/[^a-zA-Z0-9]/g, '_').slice(0,16); }

window.lookupWord = lookupWord;
