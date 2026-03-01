/* =========================
   LOOKUP
========================= */

const JISHO_API = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.jishoApi)
  || "https://minireader.zoe-caudron.workers.dev/?keyword=";

document.getElementById('search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupWord();
});

async function lookupWord(queryOverride) {
  const q = (queryOverride ?? document.getElementById('search-input')?.value ?? '').trim();
  if (!q) return;

  const res = document.getElementById('results');
  if (res) res.innerHTML = '<p class="status-msg">Searching…</p>';

  try {
    const r = await fetch(JISHO_API + encodeURIComponent(q));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    renderResults(data.data || []);
  } catch (e) {
    if (res) {
      res.innerHTML =
        `<p class="status-msg">⚠️ Dictionary lookup failed. Try searching directly: ` +
        `<a href="https://jisho.org/search/${encodeURIComponent(q)}" target="_blank" rel="noreferrer"
           style="color:var(--accent-stroke)">jisho.org ↗</a></p>`;
    }
  }
}

function renderResults(entries) {
  const res = document.getElementById('results');
  if (!res) return;

  if (!entries.length) {
    res.innerHTML = '<p class="status-msg">No results found.</p>';
    return;
  }

  res.innerHTML = '';
  // Use a numeric index for IDs — sanitize() turns all kanji to '_' causing collisions
  entries.slice(0, 8).forEach((entry, i) => {
    const word     = entry.japanese[0]?.word || entry.japanese[0]?.reading || '';
    const reading  = entry.japanese[0]?.reading || '';
    const meanings = entry.senses[0]?.english_definitions?.join('; ') || '';
    const tags     = [...(entry.senses[0]?.parts_of_speech || [])].slice(0,2).join(', ');
    const jlpt     = entry.jlpt?.[0] || '';
    const uid      = 'res' + i;   // guaranteed unique, no kanji collision

    const shelfOpts = (typeof shelfBookOptions === 'function') ? shelfBookOptions() : '';
    const oldOpts   = (typeof books !== 'undefined' && books.length)
      ? books.map(b => `<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('')
      : '';
    const allOpts   = shelfOpts || oldOpts || '<option disabled>No books yet</option>';

    const div = document.createElement('div');
    div.className = 'result-entry';
    div.innerHTML = `
      <div class="word-header">
        <span class="kanji-large">${escapeHtml(word)}</span>
        <span class="reading">${word !== reading ? escapeHtml(reading) : ''}</span>
        ${jlpt ? `<span class="jlpt-badge">${escapeHtml(jlpt.toUpperCase())}</span>` : ''}
      </div>
      <div class="meanings">${escapeHtml(meanings)}</div>
      ${tags ? `<div class="tags">${escapeHtml(tags)}</div>` : ''}
      <div class="add-btn">
        <select class="lookup-book-select" id="bk-${uid}" style="max-width:200px">
          ${allOpts}
        </select>
        <button class="btn btn-sm"
          onclick='addToSelectedBook(${JSON.stringify(word)}, ${JSON.stringify(reading)}, ${JSON.stringify(meanings)}, "bk-${uid}", ${JSON.stringify(jlpt)})'>
          + Add to book
        </button>
      </div>`;
    res.appendChild(div);
  });
}

function addToSelectedBook(word, reading, meaning, selectId, jlpt = '') {
  const sel = document.getElementById(selectId);
  if (!sel || !sel.value) {
    // Fallback: if select not found, show an alert so the bug is visible
    console.error('[lookup] select not found:', selectId);
    return;
  }
  const bookId = sel.value;

  let added = false;
  if (bookId.startsWith('sb') && typeof addWordToShelf === 'function') {
    added = addWordToShelf(word, reading, meaning, bookId, jlpt);
  } else if (typeof addToBook === 'function') {
    addToBook(word, reading, meaning, selectId);
    added = true;
  }

  if (added === false) {
    // already exists — flash the select
    sel.style.outline = '2px solid var(--accent-stroke)';
    setTimeout(() => sel.style.outline = '', 1200);
    return;
  }

  // Visual feedback
  const btn = sel.nextElementSibling;
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = '✓ Added';
    btn.style.borderColor = 'var(--accent2-stroke)';
    setTimeout(() => { btn.textContent = orig; btn.style.borderColor = ''; }, 1400);
  }
}

function sanitize(s) { return String(s || '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 16); }

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
