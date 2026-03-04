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
  const uid_map = {};
  entries.slice(0, 8).forEach((entry, idx) => {
    const word     = entry.japanese[0]?.word || entry.japanese[0]?.reading || '';
    const reading  = entry.japanese[0]?.reading || '';
    const meanings = entry.senses[0]?.english_definitions?.join('; ') || '';
    const tags     = [...(entry.senses[0]?.parts_of_speech || [])].slice(0,2).join(', ');
    const jlpt     = entry.jlpt?.[0] || '';
    const uid      = 'res' + idx;

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
        ${jlpt ? `<span class="jlpt-badge">${escapeHtml(jlpt.replace(/^jlpt-/i, '').toUpperCase())}</span>` : ''}
        ${getWkBadge(word)}
      </div>
      <div class="meanings">${escapeHtml(meanings)}</div>
      ${tags ? `<div class="tags">${escapeHtml(tags)}</div>` : ''}
      <div class="add-btn">
        <select class="lookup-book-select" id="bk-${uid}" style="max-width:200px">
          ${allOpts}
        </select>
        <button class="btn btn-sm add-to-book-btn">+ Add to book</button>
      </div>`;
    res.appendChild(div);

    // Wire up add button via closure — avoids apostrophe/quote HTML injection bugs
    div.querySelector('.add-to-book-btn').addEventListener('click', () => {
      addToSelectedBook(word, reading, meanings, 'bk-' + uid, jlpt);
    });
  });
}


// ── WaniKani level badge ───────────────────────────────────────────────────
function getWkBadge(word) {
  const token = localStorage.getItem('wk-token');
  const cache = JSON.parse(localStorage.getItem('wk-level-cache') || '{}');
  if (cache[word] != null) {
    return `<span class="wk-badge" title="WaniKani level">WK${cache[word]}</span>`;
  }
  if (token && word) {
    // Async fetch — update badge once we get the result
    fetchWkLevel(word);
  }
  return '';
}

async function fetchWkLevel(word) {
  const token = localStorage.getItem('wk-token');
  if (!token || !word) return;
  const cache = JSON.parse(localStorage.getItem('wk-level-cache') || '{}');
  if (cache[word] !== undefined) return;

  try {
    const r = await fetch(
      `https://api.wanikani.com/v2/subjects?types=vocabulary,kanji&slugs=${encodeURIComponent(word)}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Wanikani-Revision': '20170710' } }
    );
    if (!r.ok) return;
    const d = await r.json();
    const subject = d.data?.[0];
    if (!subject) return;
    const level = subject.data?.level;
    if (level == null) return;
    cache[word] = level;
    localStorage.setItem('wk-level-cache', JSON.stringify(cache));
    // Re-render any visible badges for this word
    document.querySelectorAll('.wk-badge-pending[data-word]').forEach(el => {
      if (el.dataset.word === word) {
        el.textContent = `WK${level}`;
        el.classList.remove('wk-badge-pending');
        el.classList.add('wk-badge');
      }
    });
  } catch (_) {}
}

function addToSelectedBook(word, reading, meaning, selectId, jlpt = '') {
  const sel = document.getElementById(selectId);
  if (!sel || !sel.value) return;
  const bookId = sel.value;

  let added = false;
  if (bookId.startsWith('sb') && typeof addWordToShelf === 'function') {
    added = addWordToShelf(word, reading, meaning, bookId, jlpt);
  } else if (typeof addToBook === 'function') {
    addToBook(word, reading, meaning, selectId);
    added = true;
  }

  if (added === false) {
    sel.style.outline = '2px solid var(--accent-stroke)';
    setTimeout(() => sel.style.outline = '', 1200);
    return;
  }

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
