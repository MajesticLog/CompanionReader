/* =========================
   WANIKANI SETTINGS + VOCAB ENRICHMENT
   Stores API token in localStorage.
   Enriches existing vocab with WK levels on connect.
========================= */

// ── Settings modal ─────────────────────────────────────────────────────────
function openWkSettings() {
  const token = localStorage.getItem('wk-token') || '';
  document.getElementById('wk-token-input').value = token;
  const status = document.getElementById('wk-status');
  if (token) {
    status.textContent = '✓ Connected';
    status.style.color = 'var(--accent2-stroke, #5a8a5a)';
  } else {
    status.textContent = '';
  }
  document.getElementById('wk-modal').classList.add('open');
}

function closeWkSettings() {
  document.getElementById('wk-modal').classList.remove('open');
}

document.getElementById('wk-modal')
  ?.addEventListener('click', e => { if (e.target === e.currentTarget) closeWkSettings(); });

async function saveWkToken() {
  const token = document.getElementById('wk-token-input').value.trim();
  const status = document.getElementById('wk-status');

  if (!token) {
    localStorage.removeItem('wk-token');
    localStorage.removeItem('wk-level-cache');
    status.textContent = 'Token removed.';
    status.style.color = '';
    return;
  }

  status.textContent = 'Verifying…';
  status.style.color = '';

  try {
    const r = await fetch('https://api.wanikani.com/v2/user', {
      headers: { 'Authorization': `Bearer ${token}`, 'Wanikani-Revision': '20170710' }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const username = d.data?.username || 'Unknown';
    const level = d.data?.level || '?';
    localStorage.setItem('wk-token', token);
    localStorage.removeItem('wk-level-cache'); // clear stale cache on new token
    status.textContent = `✓ Connected as ${username} (Level ${level})`;
    status.style.color = 'var(--accent2-stroke, #5a8a5a)';

    // Kick off background vocab enrichment
    enrichVocabWithWk();
  } catch (e) {
    status.textContent = '⚠ Invalid token — check and try again.';
    status.style.color = '#c05050';
  }
}

// ── Background vocab enrichment ────────────────────────────────────────────
// After connecting WK, fetch levels for all saved vocab words that are missing wk_level.
// Cache stores: number = WK level, null = looked up but not on WK (negative cache).
// Negative-cached words are not re-fetched unless the cache is cleared on token change.

async function enrichVocabWithWk() {
  const token = localStorage.getItem('wk-token');
  if (!token) return;

  let shelf;
  try { shelf = JSON.parse(localStorage.getItem('tsundoku-shelf') || '[]'); }
  catch (_) { return; }

  // Cache: { word: level (number) | null (not on WK) }
  const cache = JSON.parse(localStorage.getItem('wk-level-cache') || '{}');

  // First pass: apply any cached levels we already know about
  let quickUpdated = 0;
  for (const entry of shelf)
    for (const v of (entry.vocab || []))
      if (!v.wk_level && v.word && typeof cache[v.word] === 'number') {
        v.wk_level = cache[v.word];
        quickUpdated++;
      }

  if (quickUpdated) {
    localStorage.setItem('tsundoku-shelf', JSON.stringify(shelf));
    if (typeof renderShelfDetail === 'function') renderShelfDetail();
    console.log(`[WK] Applied ${quickUpdated} cached WK levels.`);
  }

  // Collect words that aren't in cache at all (skip both positive & negative cached)
  const toFetch = new Set();
  for (const entry of shelf)
    for (const v of (entry.vocab || []))
      if (!v.wk_level && v.word && !(v.word in cache)) toFetch.add(v.word);

  if (!toFetch.size) return;
  console.log(`[WK] Fetching WK levels for ${toFetch.size} new words…`);

  // Batch into groups of 10 slugs per request
  const words = [...toFetch];
  let hitRateLimit = false;

  for (let i = 0; i < words.length; i += 10) {
    if (hitRateLimit) break;

    const batch = words.slice(i, i + 10);
    const slugs = batch.map(encodeURIComponent).join(',');
    try {
      const r = await fetch(
        `https://api.wanikani.com/v2/subjects?types=vocabulary,kanji&slugs=${slugs}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Wanikani-Revision': '20170710' } }
      );

      if (r.status === 429) {
        console.warn('[WK] Rate limited — stopping enrichment, will retry next load.');
        hitRateLimit = true;
        break;
      }
      if (!r.ok) continue;

      const d = await r.json();
      const found = new Set();
      for (const subject of (d.data || [])) {
        const w = subject.data?.slug || subject.data?.characters;
        const lvl = subject.data?.level;
        if (w && lvl != null) { cache[w] = lvl; found.add(w); }
      }

      // Negative-cache: words we asked about but WK didn't return
      for (const w of batch)
        if (!found.has(w) && !(w in cache)) cache[w] = null;

    } catch (_) {}

    // ~1.1s between batches to stay well within 60 req/min
    await new Promise(res => setTimeout(res, 1100));
  }

  localStorage.setItem('wk-level-cache', JSON.stringify(cache));

  // Write newly fetched levels back into shelf vocab
  let updated = 0;
  for (const entry of shelf) {
    for (const v of (entry.vocab || [])) {
      if (!v.wk_level && v.word && typeof cache[v.word] === 'number') {
        v.wk_level = cache[v.word];
        updated++;
      }
    }
  }

  if (updated) {
    localStorage.setItem('tsundoku-shelf', JSON.stringify(shelf));
    if (typeof renderShelfDetail === 'function') renderShelfDetail();
    console.log(`[WK] Updated ${updated} vocab entries with WaniKani levels.`);
  }
}

window.openWkSettings  = openWkSettings;
window.closeWkSettings = closeWkSettings;
window.saveWkToken     = saveWkToken;

// Run enrichment on page load if token already set
if (localStorage.getItem('wk-token')) {
  // Small delay to let shelf load first
  setTimeout(enrichVocabWithWk, 2000);
}
