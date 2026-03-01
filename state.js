// =========================
// Config (endpoints)
// =========================
window.TSUNDOKU_CONFIG = {
  jishoApi: "https://jisho.org/api/v1/search/words?keyword=",
  workerWordsEndpoint: "https://minireader.zoe-caudron.workers.dev/",
  handwriteEndpoint: "https://minireader.zoe-caudron.workers.dev/handwrite",
};

/* =========================
   STATE
========================= */
let books = JSON.parse(localStorage.getItem('rdbooks') || '[]');
window.books = books;
let activeBook = null;
window.selectedRadicals = window.selectedRadicals || new Set();
// alias for legacy code
let selectedRadicals = window.selectedRadicals;
