/* =========================
   NAV
========================= */
function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const map = { lookup: 0, bookshelf: 1, lists: 2, writing: 3, radicals: 4, flashcards: 5 };
    const i = map[id];
    const btns = document.querySelectorAll('nav button');
    if (Number.isInteger(i) && btns[i]) btns[i].classList.add('active');
  }

  try { if (id === 'bookshelf' && typeof renderShelf === 'function') { renderShelf(); renderShelfDetail(); } } catch(e) { console.error(e); }
  try { if (id === 'lists' && typeof renderBookList === 'function') renderBookList(); } catch(e) { console.error(e); }
  try { if (id === 'radicals' && typeof renderRadicals === 'function') renderRadicals(); } catch(e) { console.error(e); }
  try { if (id === 'writing' && typeof hwResizeAll === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(hwResizeAll));
  } } catch(e) { console.error(e); }
  try {
    if (id === 'flashcards') {
      const setup = document.getElementById('fc-setup');
      const study = document.getElementById('fc-study');
      const results = document.getElementById('fc-results');
      if (setup) setup.style.display = 'block';
      if (study) study.classList.remove('active');
      if (results) results.classList.remove('active');
      if (typeof showFlashcardsSetup === 'function') showFlashcardsSetup();
    }
  } catch(e) { console.error(e); }
}

window.showPanel = showPanel;
