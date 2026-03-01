/* =========================
   INIT
========================= */

function initApp() {
  if (typeof hwInit === 'function') hwInit();
  if (typeof renderBookList === 'function') renderBookList();
  if (typeof initShelf === 'function') initShelf();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ── Theme dots ──────────────────────────────────────
function applyTheme(theme) {
  const t = (theme || 'flowers').toLowerCase();
  if (t === 'flowers') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('tsundoku-theme', t);
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === t);
  });
}

function initThemeDots() {
  const saved = localStorage.getItem('tsundoku-theme') || 'flowers';
  applyTheme(saved);
  document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

document.addEventListener('DOMContentLoaded', initThemeDots);
