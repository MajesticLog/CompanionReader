/* =========================
   BOOKSHELF TAB
   - Reading log with status, rating, notes
   - Each entry has its own vocab list
   - Vocab exportable as CSV
   - "Add to book" in Lookup populates these vocab lists
========================= */

// bookshelf entries stored separately from the old word-list books
// schema: { id, title, author, status, rating, notes, cover, dateAdded, dateFinished, vocab: [{word,reading,meaning}] }
let shelf = JSON.parse(localStorage.getItem('tsundoku-shelf') || '[]');
let activeShelfId = null;   // which entry is open in the detail pane
let shelfVocabFilter = '';  // live search within vocab table

function saveShelf() {
  localStorage.setItem('tsundoku-shelf', JSON.stringify(shelf));
}

// ── Helpers ────────────────────────────────────────
function shelfEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

const STATUS_LABELS = {
  reading:   '📖 Reading',
  finished:  '✅ Finished',
  paused:    '⏸ Paused',
  wishlist:  '🌸 Want to read',
};

function starHtml(rating) {
  // rating 0-5, renders filled/empty stars
  let out = '';
  for (let i = 1; i <= 5; i++) {
    out += `<span class="star ${i <= rating ? 'filled' : ''}" data-v="${i}">★</span>`;
  }
  return out;
}

// ── Render shelf list (left column) ───────────────
function renderShelf() {
  const list = document.getElementById('shelf-list');
  if (!list) return;

  if (!shelf.length) {
    list.innerHTML = '<p class="status-msg" style="padding:12px">No books yet. Add one above.</p>';
    return;
  }

  // Group by status
  const groups = { reading: [], paused: [], finished: [], wishlist: [] };
  shelf.forEach(e => { (groups[e.status] || groups.wishlist).push(e); });

  const order = ['reading', 'paused', 'finished', 'wishlist'];
  list.innerHTML = '';

  order.forEach(status => {
    const entries = groups[status];
    if (!entries.length) return;

    const header = document.createElement('div');
    header.className = 'shelf-group-label';
    header.textContent = STATUS_LABELS[status];
    list.appendChild(header);

    entries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'shelf-item' + (activeShelfId === entry.id ? ' active' : '');
      item.innerHTML = `
        <div class="shelf-item-title">${shelfEsc(entry.title)}</div>
        <div class="shelf-item-meta">
          ${entry.author ? `<span>${shelfEsc(entry.author)}</span>` : ''}
          <span class="shelf-item-stars">${'★'.repeat(entry.rating || 0)}${'☆'.repeat(5 - (entry.rating || 0))}</span>
          <span class="shelf-vocab-count">${entry.vocab.length} words</span>
        </div>`;
      item.onclick = () => openShelfEntry(entry.id);
      list.appendChild(item);
    });
  });
}

// ── Open entry in detail pane ──────────────────────
function openShelfEntry(id) {
  activeShelfId = id;
  renderShelf();
  renderShelfDetail();
}

function renderShelfDetail() {
  const pane = document.getElementById('shelf-detail');
  if (!pane) return;

  const entry = shelf.find(e => e.id === activeShelfId);

  if (!entry) {
    pane.innerHTML = `<div class="shelf-empty-detail">
      <p class="empty-state">Select a book to see details,<br>or add a new one above.</p>
    </div>`;
    return;
  }

  pane.innerHTML = `
    <div class="shelf-detail-inner">

      <!-- Header row: title + actions -->
      <div class="shelf-detail-header">
        <div class="shelf-detail-titles">
          <div class="shelf-detail-title">${shelfEsc(entry.title)}</div>
          ${entry.author ? `<div class="shelf-detail-author">${shelfEsc(entry.author)}</div>` : ''}
        </div>
        <div class="shelf-detail-actions">
          <button class="btn btn-sm btn-outline" onclick="editShelfEntry('${entry.id}')">Edit</button>
          <button class="btn btn-sm btn-outline" onclick="deleteShelfEntry('${entry.id}')" style="border-color:var(--accent-stroke);color:var(--accent-stroke)">Delete</button>
        </div>
      </div>

      <!-- Status + rating row -->
      <div class="shelf-meta-row">
        <span class="shelf-status-badge">${STATUS_LABELS[entry.status] || entry.status}</span>
        <span class="shelf-stars" id="shelf-stars-${entry.id}">${starHtml(entry.rating || 0)}</span>
        ${entry.dateFinished ? `<span class="shelf-date">Finished ${shelfEsc(entry.dateFinished)}</span>` : ''}
      </div>

      <!-- Notes -->
      <div class="shelf-section">
        <div class="shelf-section-label">My Notes</div>
        ${entry.notes
          ? `<div class="shelf-notes-text">${shelfEsc(entry.notes).replace(/\n/g,'<br>')}</div>`
          : `<p class="status-msg" style="margin:0">No notes yet — click Edit to add some.</p>`}
      </div>

      <!-- Vocab list -->
      <div class="shelf-section">
        <div class="shelf-section-label shelf-vocab-header">
          <span>Vocab List <span class="shelf-vocab-badge">${entry.vocab.length}</span></span>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input class="shelf-vocab-search" id="shelf-vocab-search"
              placeholder="Filter words…" type="text" value="${shelfEsc(shelfVocabFilter)}"
              oninput="shelfVocabFilter=this.value;renderShelfDetail()" />
            ${entry.vocab.length
              ? `<button class="btn btn-sm btn-outline" onclick="exportShelfVocabCSV('${entry.id}')">Export CSV</button>`
              : ''}
          </div>
        </div>
        ${renderVocabTable(entry)}
      </div>

    </div>`;

  // Attach star click handlers
  pane.querySelectorAll(`#shelf-stars-${entry.id} .star`).forEach(s => {
    s.onclick = () => rateShelfEntry(entry.id, +s.dataset.v);
  });
}

function renderVocabTable(entry) {
  const filter = shelfVocabFilter.toLowerCase();
  const words = filter
    ? entry.vocab.filter(w =>
        w.word.includes(filter) || w.reading.includes(filter) ||
        w.meaning.toLowerCase().includes(filter))
    : entry.vocab;

  if (!entry.vocab.length) {
    return `<p class="status-msg" style="margin:0">No vocab yet. Look up words and add them to <strong>${shelfEsc(entry.title)}</strong> using the Lookup tab.</p>`;
  }
  if (!words.length) {
    return `<p class="status-msg" style="margin:0">No words match "<em>${shelfEsc(shelfVocabFilter)}</em>".</p>`;
  }

  let rows = words.map((w, i) => {
    // find real index for deletion
    const realIdx = entry.vocab.indexOf(w);
    return `<tr>
      <td class="kanji-cell">${shelfEsc(w.word)}</td>
      <td class="reading-cell">${shelfEsc(w.reading)}</td>
      <td class="meaning-cell">${shelfEsc(w.meaning)}</td>
      <td class="action-cell"><button class="del-btn" onclick="removeShelfWord('${entry.id}', ${realIdx})" title="Remove">✕</button></td>
    </tr>`;
  }).join('');

  return `<table class="words-table">
    <thead><tr><th>Word</th><th>Reading</th><th>Meaning</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── CRUD ───────────────────────────────────────────
function openAddShelfModal(prefillTitle) {
  document.getElementById('shelf-modal-title-label').textContent = 'Add Book';
  document.getElementById('shelf-form-id').value = '';
  document.getElementById('shelf-form-title').value = prefillTitle || '';
  document.getElementById('shelf-form-author').value = '';
  document.getElementById('shelf-form-status').value = 'reading';
  document.getElementById('shelf-form-date').value = '';
  document.getElementById('shelf-form-notes').value = '';
  document.getElementById('shelf-modal-rating').dataset.value = '0';
  renderModalStars(0);
  document.getElementById('shelf-modal').classList.add('open');
  document.getElementById('shelf-form-title').focus();
}

function editShelfEntry(id) {
  const entry = shelf.find(e => e.id === id);
  if (!entry) return;
  document.getElementById('shelf-modal-title-label').textContent = 'Edit Book';
  document.getElementById('shelf-form-id').value = id;
  document.getElementById('shelf-form-title').value = entry.title;
  document.getElementById('shelf-form-author').value = entry.author || '';
  document.getElementById('shelf-form-status').value = entry.status || 'reading';
  document.getElementById('shelf-form-date').value = entry.dateFinished || '';
  document.getElementById('shelf-form-notes').value = entry.notes || '';
  const r = entry.rating || 0;
  document.getElementById('shelf-modal-rating').dataset.value = r;
  renderModalStars(r);
  document.getElementById('shelf-modal').classList.add('open');
}

function closeShelfModal() {
  document.getElementById('shelf-modal').classList.remove('open');
}

function renderModalStars(val) {
  document.querySelectorAll('#shelf-modal-rating .star').forEach(s => {
    s.classList.toggle('filled', +s.dataset.v <= val);
  });
}

function saveShelfModal() {
  const id    = document.getElementById('shelf-form-id').value;
  const title = document.getElementById('shelf-form-title').value.trim();
  if (!title) { document.getElementById('shelf-form-title').focus(); return; }

  const data = {
    title,
    author:       document.getElementById('shelf-form-author').value.trim(),
    status:       document.getElementById('shelf-form-status').value,
    dateFinished: document.getElementById('shelf-form-date').value,
    notes:        document.getElementById('shelf-form-notes').value.trim(),
    rating:       +(document.getElementById('shelf-modal-rating').dataset.value || 0),
  };

  if (id) {
    // edit existing
    const entry = shelf.find(e => e.id === id);
    if (entry) Object.assign(entry, data);
  } else {
    // new entry
    shelf.unshift({ id: 'sb' + Date.now(), vocab: [], dateAdded: new Date().toISOString().slice(0,10), ...data });
    activeShelfId = shelf[0].id;
  }

  saveShelf();
  closeShelfModal();
  renderShelf();
  renderShelfDetail();

  // keep lookup "add-to" dropdowns in sync
  if (typeof renderResults === 'function' && document.getElementById('results')?.children.length) {
    // re-render quietly by just refreshing the selects
    refreshLookupBookSelects();
  }
}

function deleteShelfEntry(id) {
  if (!confirm('Delete this book entry and its vocab list?')) return;
  shelf = shelf.filter(e => e.id !== id);
  if (activeShelfId === id) activeShelfId = shelf[0]?.id || null;
  saveShelf();
  renderShelf();
  renderShelfDetail();
}

function rateShelfEntry(id, rating) {
  const entry = shelf.find(e => e.id === id);
  if (!entry) return;
  entry.rating = rating;
  saveShelf();
  renderShelfDetail();
}

// ── Vocab operations ───────────────────────────────
function addWordToShelf(word, reading, meaning, bookId) {
  // bookId here is a shelf entry id (sb…)
  const entry = shelf.find(e => e.id === bookId);
  if (!entry) return false;
  // avoid exact duplicates
  if (entry.vocab.some(v => v.word === word && v.reading === reading)) return false;
  entry.vocab.push({ word, reading, meaning });
  saveShelf();
  if (activeShelfId === bookId) renderShelfDetail();
  renderShelf(); // update word count
  return true;
}

function removeShelfWord(entryId, idx) {
  const entry = shelf.find(e => e.id === entryId);
  if (!entry) return;
  entry.vocab.splice(idx, 1);
  saveShelf();
  renderShelfDetail();
  renderShelf();
}

function exportShelfVocabCSV(entryId) {
  const entry = shelf.find(e => e.id === entryId);
  if (!entry || !entry.vocab.length) return;
  const rows = [
    ['Book', 'Word', 'Reading', 'Meaning'],
    ...entry.vocab.map(w => [entry.title, w.word, w.reading, w.meaning])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = (entry.title || 'vocab') + '.csv';
  a.click();
}

// ── Quick-add shelf entry from the search bar ──────
function quickAddShelfBook() {
  const inp = document.getElementById('shelf-quick-title');
  const title = inp?.value.trim();
  if (!title) return;
  shelf.unshift({ id: 'sb' + Date.now(), title, author: '', status: 'reading', rating: 0, notes: '', vocab: [], dateAdded: new Date().toISOString().slice(0,10), dateFinished: '' });
  activeShelfId = shelf[0].id;
  saveShelf();
  if (inp) inp.value = '';
  renderShelf();
  renderShelfDetail();
  refreshLookupBookSelects();
}

// keep the Lookup tab "add to book" selects in sync when shelf changes
function refreshLookupBookSelects() {
  document.querySelectorAll('.lookup-book-select').forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = shelfBookOptions();
    if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
  });
}

function shelfBookOptions() {
  if (!shelf.length) return '<option disabled>No books yet</option>';
  return shelf.map(e => `<option value="${e.id}">${shelfEsc(e.title)}</option>`).join('');
}

// ── Init ────────────────────────────────────────────
function initShelf() {
  renderShelf();
  if (shelf.length) {
    activeShelfId = shelf[0].id;
    renderShelfDetail();
  } else {
    renderShelfDetail();
  }

  // Modal star clicks
  document.querySelectorAll('#shelf-modal-rating .star').forEach(s => {
    s.onclick = () => {
      const v = +s.dataset.v;
      document.getElementById('shelf-modal-rating').dataset.value = v;
      renderModalStars(v);
    };
  });

  // Modal: close on backdrop click
  document.getElementById('shelf-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('shelf-modal')) closeShelfModal();
  });

  // Modal: Enter key in title submits
  document.getElementById('shelf-form-title')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveShelfModal();
  });
}

window.renderShelf      = renderShelf;
window.openShelfEntry   = openShelfEntry;
window.openAddShelfModal= openAddShelfModal;
window.closeShelfModal  = closeShelfModal;
window.saveShelfModal   = saveShelfModal;
window.editShelfEntry   = editShelfEntry;
window.deleteShelfEntry = deleteShelfEntry;
window.rateShelfEntry   = rateShelfEntry;
window.removeShelfWord  = removeShelfWord;
window.exportShelfVocabCSV = exportShelfVocabCSV;
window.quickAddShelfBook= quickAddShelfBook;
window.addWordToShelf   = addWordToShelf;
window.shelfBookOptions = shelfBookOptions;
window.refreshLookupBookSelects = refreshLookupBookSelects;
window.initShelf        = initShelf;
