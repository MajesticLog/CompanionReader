/* =============================================================
   JLPT Backfill v2 — kanjiapi returns jlpt as NUMBER not string
   ============================================================= */
(async function backfillJlpt() {
  localStorage.removeItem('jlpt-backfill-done');      // reset old broken flag
  if (localStorage.getItem('jlpt-backfill-v2-done')) return;

  let shelf;
  try { shelf = JSON.parse(localStorage.getItem('tsundoku-shelf') || '[]'); }
  catch (_) { return; }

  let updated = 0;

  for (const entry of shelf) {
    if (!entry.vocab?.length) continue;
    for (const vocab of entry.vocab) {
      if (vocab.jlpt) continue;

      const kanji = [...(vocab.word || '')].find(c => /[\u4e00-\u9fff\u3400-\u4dbf]/.test(c));
      if (!kanji) continue;

      try {
        const r = await fetch('https://kanjiapi.dev/v1/kanji/' + encodeURIComponent(kanji), {
          signal: AbortSignal.timeout(3000),
        });
        if (!r.ok) continue;
        const k = await r.json();
        // kanjiapi returns jlpt as a NUMBER e.g. 1,2,3,4 not "N1"
        if (k.jlpt == null) continue;
        vocab.jlpt = 'jlpt-n' + k.jlpt;
        updated++;
      } catch (_) {}

      await new Promise(res => setTimeout(res, 80));
    }
  }

  localStorage.setItem('tsundoku-shelf', JSON.stringify(shelf));
  localStorage.setItem('jlpt-backfill-v2-done', '1');
  if (typeof renderShelfDetail === 'function') renderShelfDetail();
  if (typeof renderShelf === 'function') renderShelf();
  console.log('[jlpt-backfill] Done — updated', updated, 'words');
})();
