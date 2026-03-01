/* =========================
   BOOKS
   - title
   - status: reading | read
   - rating: 0..5
   - per-book vocab list (filled from Dictionary lookup)
========================= */

function saveBooks(){ localStorage.setItem('rdbooks', JSON.stringify(books)); }

function normalizeBooks(){
  books = (books || []).map(b => ({
    id: b.id || ('bk' + Date.now()),
    title: b.title || 'Untitled',
    status: b.status || 'reading',
    rating: Number.isFinite(b.rating) ? b.rating : 0,
    words: Array.isArray(b.words) ? b.words : [],
  }));
  window.books = books;
  saveBooks();
}

function addBook(){
  const inp = document.getElementById('new-book-input');
  const title = (inp?.value || '').trim();
  if (!title) return;

  const book = { id: 'bk' + Date.now(), title, status: 'reading', rating: 0, words: [] };
  books.push(book);
  activeBook = book.id;
  saveBooks();
  window.books = books;
  if (inp) inp.value = '';
  renderBookList();
  renderBookDetail();
}

function renderBookList(){
  normalizeBooks();

  const bl = document.getElementById('book-list');
  if (!bl) return;
  bl.innerHTML = '';

  if (!books.length){
    bl.innerHTML = '<p class="status-msg">No books yet. Add one above.</p>';
    return;
  }

  books.forEach(book => {
    const d = document.createElement('div');
    d.className = 'book-item' + (activeBook === book.id ? ' active' : '');
    d.innerHTML = `
      <div class="book-title-row">
        <div class="book-title">${escapeHTML(book.title)}</div>
        <div class="book-badges">
          <span class="badge">${book.status === 'read' ? 'Read' : 'Reading'}</span>
          ${book.rating ? `<span class="badge">★${book.rating}</span>` : ``}
        </div>
      </div>
      <div class="book-count">${book.words.length} words</div>
    `;
    d.onclick = () => { activeBook = book.id; renderBookList(); renderBookDetail(); };
    bl.appendChild(d);
  });

  if (!activeBook && books[0]) { activeBook = books[0].id; renderBookList(); renderBookDetail(); }
}

function renderStars(container, rating, onSet){
  container.innerHTML = '';
  for (let i=1;i<=5;i++){
    const b=document.createElement('button');
    b.type='button';
    b.className='star-btn' + (i<=rating ? ' on' : '');
    b.textContent = '★';
    b.title = String(i);
    b.onclick = () => onSet(i);
    container.appendChild(b);
  }
  const clear = document.createElement('button');
  clear.type='button';
  clear.className='star-btn clear';
  clear.textContent='✕';
  clear.title='Clear rating';
  clear.onclick = () => onSet(0);
  container.appendChild(clear);
}

function renderBookDetail(){
  normalizeBooks();

  const book = books.find(b => b.id === activeBook);
  const titleEl = document.getElementById('book-detail-title');
  const content = document.getElementById('book-detail-content');
  const controls = document.getElementById('book-meta-controls');
  const statusSel = document.getElementById('book-status');
  const ratingWrap = document.getElementById('book-rating');

  if (!titleEl || !content) return;

  if (!book){
    titleEl.textContent = 'Book — 詳細';
    if (controls) controls.style.display='none';
    content.innerHTML = '<p class="empty-state">Select or create a book to see details.</p>';
    return;
  }

  titleEl.textContent = `${book.title} — 詳細`;
  if (controls) controls.style.display='flex';

  if (statusSel){
    statusSel.value = book.status || 'reading';
    statusSel.onchange = () => {
      book.status = statusSel.value;
      saveBooks();
      window.books = books;
      renderBookList();
    };
  }

  if (ratingWrap){
    renderStars(ratingWrap, book.rating || 0, (v)=>{
      book.rating = v;
      saveBooks();
      window.books = books;
      renderBookList();
      renderBookDetail();
    });
  }

  if (!book.words.length){
    content.innerHTML = '<p class="empty-state">No vocab yet. Look up words in Dictionary and add them here.</p>';
    return;
  }

  let html = `
    <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm btn-outline" type="button" onclick="exportCSV()">Export CSV</button>
    </div>
    <table class="words-table">
      <thead><tr><th>Kanji</th><th>Reading</th><th>Meaning</th><th></th></tr></thead>
      <tbody>
  `;

  book.words.forEach((w,i)=>{
    html += `
      <tr>
        <td class="kanji-cell">${escapeHTML(w.word || '')}</td>
        <td class="reading-cell">${escapeHTML(w.reading || '')}</td>
        <td class="meaning-cell">${escapeHTML(w.meaning || '')}</td>
        <td class="action-cell"><button class="del-btn" type="button" onclick="removeWord(${i})" title="Remove">✕</button></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  content.innerHTML = html;
}

function removeWord(idx){
  const book = books.find(b => b.id === activeBook);
  if (!book) return;
  book.words.splice(idx,1);
  saveBooks();
  window.books = books;
  renderBookList();
  renderBookDetail();
}

function deleteBook(){
  const book = books.find(b => b.id === activeBook);
  if (!book) return;
  if (!confirm('Delete this book and all its words?')) return;
  books = books.filter(b => b.id !== activeBook);
  window.books = books;
  activeBook = books[0]?.id || null;
  saveBooks();
  renderBookList();
  renderBookDetail();
}

function exportCSV(){
  const book = books.find(b => b.id === activeBook);
  if (!book) return;
  const rows = [['Word','Reading','Meaning'], ...book.words.map(w => [w.word, w.reading, w.meaning])];
  const csv = rows.map(r => r.map(c => `"${String(c||'').replaceAll('"','""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = (book.title || 'wordlist') + '.csv';
  a.click();
}

function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

window.addBook = addBook;
window.renderBookList = renderBookList;
window.renderBookDetail = renderBookDetail;
window.removeWord = removeWord;
window.deleteBook = deleteBook;
window.exportCSV = exportCSV;
