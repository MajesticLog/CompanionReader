/* =========================
   NAV
========================= */
function showPanel(id, btn) {
  // panels
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.add('active');

  // nav active state
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const map = { lookup: 0, books: 1, writing: 2, radicals: 3, flashcards: 4 };
    const i = map[id];
    const btns = document.querySelectorAll('nav button');
    if (Number.isInteger(i) && btns[i]) btns[i].classList.add('active');
  }

  // panel hooks (guarded so one failure doesn't kill the app)
  try { if (id === 'books' && typeof renderBookList === 'function') { renderBookList(); if (typeof renderBookDetail === 'function') renderBookDetail(); } } catch(e) { console.error(e); }
  try { if (id === 'radicals' && typeof renderRadicals === 'function') renderRadicals(); } catch(e) { console.error(e); }
  try { if (id === 'writing' && typeof hwResizeAll === 'function') setTimeout(hwResizeAll, 0); } catch(e) { console.error(e); }

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


function initNav(){
  document.querySelectorAll('nav button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const onclick = btn.getAttribute('onclick') || '';
      // If inline onclick exists, it will still run; but we prefer data-panel if present.
      const m = onclick.match(/showPanel\('([a-z]+)'/);
      if (m) showPanel(m[1], btn);
    });
  });
}
document.addEventListener('DOMContentLoaded', initNav);
