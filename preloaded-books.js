/* =========================
   PRELOADED BOOKS
   Fetches curated vocab lists from the repo and silently
   inserts them into the shelf if not already present.
   Books are identified by a stable id — never duplicated.
========================= */

const PRELOADED_BOOKS = [
  {
    url: 'https://raw.githubusercontent.com/majesticlog/TsundokuFriend.io/main/N2.json',
    id:  'n2-vocab-list'
  }
];

async function loadPreloadedBooks() {
  let shelf;
  try { shelf = JSON.parse(localStorage.getItem('tsundoku-shelf') || '[]'); }
  catch (_) { shelf = []; }

  const existingIds = new Set(shelf.map(e => e.id));
  let added = 0;

  for (const { url, id } of PRELOADED_BOOKS) {
    if (existingIds.has(id)) continue; // already present, skip

    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      const entry = Array.isArray(data) ? data[0] : data;
      if (!entry) continue;

      // Ensure the id is stable regardless of what the JSON says
      entry.id = id;
      shelf.push(entry);
      existingIds.add(id);
      added++;
      console.log(`[preloaded-books] Added "${entry.title}" (${entry.vocab?.length ?? 0} words)`);
    } catch (e) {
      console.warn(`[preloaded-books] Could not load ${url}:`, e);
    }
  }

  if (added > 0) {
    localStorage.setItem('tsundoku-shelf', JSON.stringify(shelf));
    // Refresh UI if shelf is already rendered
    if (typeof renderShelf       === 'function') renderShelf();
    if (typeof renderShelfDetail === 'function') renderShelfDetail();
  }
}

// Run after shelf initialises
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadPreloadedBooks, 1500);
});
