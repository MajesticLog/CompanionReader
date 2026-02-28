/* =========================
   INIT
========================= */

window.addEventListener('resize', resizeCanvas);

function initApp() {
  // Canvas + UI
  resizeCanvas();
  clearCanvas(true);

  // Books panel
  renderBookList();

  // Flashcards setup (if user opens tab)
  // no-op here; nav.js will call showFlashcardsSetup when needed
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

