/* =========================
   FLASHCARDS
   Reads from tsundoku-shelf (Books tab) — each entry has a vocab[] array.
========================= */

let fc = {
  deck: [], queue: [], current: null, idx: 0, flipped: false,
  mode: 'kanji-to-meaning',
  stats: { again: 0, hard: 0, good: 0, easy: 0 },
  againWords: [], selectedBooks: new Set(),
};

function _shelf() {
  try { return JSON.parse(localStorage.getItem('tsundoku-shelf') || '[]'); }
  catch(_) { return []; }
}

function showFlashcardsSetup() {
  const grid  = document.getElementById('fc-book-grid');
  if (!grid) return;
  const shelf = _shelf().filter(e => e.vocab?.length > 0);
  if (!shelf.length) {
    grid.innerHTML = '<p class="status-msg">No vocab yet — look up words and add them to a book first.</p>';
    return;
  }
  grid.innerHTML = '';
  shelf.forEach(entry => {
    const btn = document.createElement('button');
    btn.className = 'fc-book-opt' + (fc.selectedBooks.has(entry.id) ? ' selected' : '');
    btn.innerHTML = `${_esc(entry.title)} <span style="font-size:0.75rem;opacity:0.6">(${entry.vocab.length})</span>`;
    btn.onclick = () => {
      fc.selectedBooks.has(entry.id) ? fc.selectedBooks.delete(entry.id) : fc.selectedBooks.add(entry.id);
      btn.classList.toggle('selected');
    };
    grid.appendChild(btn);
  });
}

function startFlashcards() {
  const shelf   = _shelf().filter(e => e.vocab?.length > 0);
  const toStudy = fc.selectedBooks.size ? shelf.filter(e => fc.selectedBooks.has(e.id)) : shelf;

  let words = toStudy.flatMap(e => e.vocab.map(w => ({ ...w, bookId: e.id })));
  if (!words.length) { alert('No words yet — add vocab from the Lookup tab.'); return; }

  fc.mode = document.getElementById('fc-mode').value;
  const order = document.getElementById('fc-order').value;
  const limit = parseInt(document.getElementById('fc-limit').value, 10);

  if (order === 'random')    words = words.sort(() => Math.random() - 0.5);
  if (order === 'hard-first') {
    const sc = JSON.parse(localStorage.getItem('fc-scores') || '{}');
    words.sort((a,b) => (sc[a.word]?.ease || 2.5) - (sc[b.word]?.ease || 2.5));
  }
  if (limit > 0) words = words.slice(0, limit);

  Object.assign(fc, { deck: words, queue: [...words], idx: 0,
    stats: { again:0, hard:0, good:0, easy:0 }, againWords: [], flipped: false });

  document.getElementById('fc-setup').style.display = 'none';
  document.getElementById('fc-results').classList.remove('active');
  document.getElementById('fc-study').classList.add('active');
  loadCard();
}

function loadCard() {
  if (fc.idx >= fc.queue.length) { showResults(); return; }
  fc.current = fc.queue[fc.idx];
  fc.flipped  = false;
  document.getElementById('fc-card-scene').classList.remove('flipped');
  document.getElementById('fc-ratings').classList.remove('visible');

  const done = fc.idx, total = fc.queue.length;
  document.getElementById('fc-count').textContent = `${done+1} / ${total}`;
  document.getElementById('fc-progress-fill').style.width = `${done/total*100}%`;
  ['again','hard','good','easy'].forEach(k =>
    document.getElementById('stat-'+k).textContent = fc.stats[k]);

  const w = fc.current, m = fc.mode;
  const fHint = document.getElementById('fc-front-hint');
  const fWord = document.getElementById('fc-front-word');
  const fSub  = document.getElementById('fc-front-sub');
  const bWord = document.getElementById('fc-back-word');
  const bMean = document.getElementById('fc-back-meaning');
  const bRead = document.getElementById('fc-back-reading');

  if (m === 'kanji-to-meaning') {
    fHint.textContent = 'KANJI';
    fWord.textContent = w.word;
    fWord.style.fontSize = w.word.length > 4 ? '2.8rem' : '4.5rem';
    fSub.textContent = '';
  } else if (m === 'meaning-to-kanji') {
    fHint.textContent = 'MEANING';
    fWord.textContent = w.meaning;
    fWord.style.fontSize = w.meaning.length > 20 ? '1.2rem' : '1.8rem';
    fSub.textContent = '';
  } else {
    fHint.textContent = 'READING';
    fWord.textContent = w.reading;
    fWord.style.fontSize = '3rem';
    fSub.textContent = '';
  }
  bWord.textContent = w.word;
  bMean.textContent = w.meaning;
  bRead.textContent = w.reading;
}

function flipCard() {
  if (fc.flipped) return;
  fc.flipped = true;
  document.getElementById('fc-card-scene').classList.add('flipped');
  document.getElementById('fc-ratings').classList.add('visible');
}

function rateCard(rating) {
  if (!fc.flipped) { flipCard(); return; }
  fc.stats[rating]++;
  const scores = JSON.parse(localStorage.getItem('fc-scores') || '{}');
  const word = fc.current.word;
  const prev = scores[word] || { ease: 2.5, interval: 1, reps: 0 };
  prev.ease = Math.max(1.3, prev.ease + {again:-0.3,hard:-0.15,good:0,easy:0.15}[rating]);
  if (rating === 'again') { prev.interval=1; prev.reps=0; fc.againWords.push(fc.current); }
  else { prev.reps++; prev.interval = Math.round(prev.interval * prev.ease); }
  scores[word] = prev;
  localStorage.setItem('fc-scores', JSON.stringify(scores));
  fc.idx++; loadCard();
}

function endSession()    { if (confirm('End session early?')) showResults(); }

function showResults() {
  document.getElementById('fc-study').classList.remove('active');
  const {again,hard,good,easy} = fc.stats;
  const total = again+hard+good+easy;
  const pct   = total > 0 ? Math.round((good+easy)/total*100) : 0;
  document.getElementById('fc-results-grid').innerHTML = `
    <div class="fc-results-stat"><div class="big" style="color:#c05050">${again}</div><div class="lbl">Again</div></div>
    <div class="fc-results-stat"><div class="big" style="color:#b07028">${hard}</div><div class="lbl">Hard</div></div>
    <div class="fc-results-stat"><div class="big" style="color:#3a8a50">${good}</div><div class="lbl">Good</div></div>
    <div class="fc-results-stat"><div class="big" style="color:#3a70a0">${easy}</div><div class="lbl">Easy</div></div>
    <div class="fc-results-stat" style="grid-column:span 4"><div class="big">${pct}%</div><div class="lbl">Known</div></div>`;
  const al = document.getElementById('fc-again-list');
  if (fc.againWords.length) {
    al.style.display = 'block';
    document.getElementById('fc-again-items').innerHTML =
      fc.againWords.map(w =>
        `<div class="fc-again-item"><span class="k">${_esc(w.word)}</span><span class="r">${_esc(w.reading)}</span><span class="m">${_esc(w.meaning)}</span></div>`
      ).join('');
  } else { al.style.display = 'none'; }
  document.getElementById('fc-results').classList.add('active');
}

function restartSession() { document.getElementById('fc-results').classList.remove('active'); startFlashcards(); }
function backToSetup()    {
  ['fc-results','fc-study'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById('fc-setup').style.display = 'block';
  showFlashcardsSetup();
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('fc-study')?.classList.contains('active')) return;
  if (e.key===' '||e.key==='Enter') { e.preventDefault(); if (!fc.flipped) flipCard(); }
  if (fc.flipped) { ({1:()=>rateCard('again'),2:()=>rateCard('hard'),3:()=>rateCard('good'),4:()=>rateCard('easy')})[e.key]?.(); }
});

function _esc(s) {
  return String(s??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
