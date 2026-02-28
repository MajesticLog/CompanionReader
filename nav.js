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
    const map = { lookup: 0, lists: 1, writing: 2, radicals: 3, flashcards: 4 };
    const i = map[id];
    const btns = document.querySelectorAll('nav button');
    if (Number.isInteger(i) && btns[i]) btns[i].classList.add('active');
  }

  // panel hooks (guarded so one failure doesn't kill the app)
  try { if (id === 'lists' && typeof renderBookList === 'function') renderBookList(); } catch(e) { console.error(e); }
  try { if (id === 'radicals' && typeof renderRadicals === 'function') renderRadicals(); } catch(e) { console.error(e); }
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
