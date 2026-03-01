// =========================
// Config (endpoints)
// =========================
window.TSUNDOKU_CONFIG = {
  // Route Jisho through the Worker so it sends browser-like headers (avoids 403)
  jishoApi: "https://minireader.zoe-caudron.workers.dev/?keyword=",
  handwriteEndpoint: "https://minireader.zoe-caudron.workers.dev/handwrite",
};

/* =========================
   STATE
========================= */
let books = JSON.parse(localStorage.getItem('rdbooks') || '[]');
let activeBook = null;
let selectedRadicals = new Set();
