/* =========================
   INIT
========================= */

function initApp() {
  // Handwriting canvases
  if (typeof hwInit === "function") hwInit();

  // Books panel
  if (typeof renderBookList === "function") renderBookList();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// =========================
// Theme dots (Flowers / Joyful / Plum)
// =========================
function applyTheme(theme) {
  const t = (theme || "flowers").toLowerCase();
  if (t === "flowers") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);

  localStorage.setItem("tsundoku-theme", t);

  document.querySelectorAll(".theme-dot").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === t);
  });
}

function initThemeDots() {
  const saved = localStorage.getItem("tsundoku-theme") || "flowers";
  applyTheme(saved);

  document.querySelectorAll(".theme-dot").forEach(btn => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
  });
}

document.addEventListener("DOMContentLoaded", initThemeDots);
