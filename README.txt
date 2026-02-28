TsundokuFriend (fixed: handwriting + radicals)

1) Put `element2kanji.json` next to `index.html` (same folder).
   - If you prefer /data/element2kanji.json, edit `ELEMENT2KANJI_URL` in radicals.js.

2) Deploy to GitHub Pages
   - Repo Settings → Pages → Deploy from branch → / (root)
   - Make sure all files are in the published folder.

3) Worker endpoints
   - handwriting.js uses:
       handwriteEndpoint: https://minireader.zoe-caudron.workers.dev/handwrite
       workerWordsEndpoint: https://minireader.zoe-caudron.workers.dev/words
   - If yours differs, set in state.js:
       window.TSUNDOKU_CONFIG = { ... }  (see state.js)
