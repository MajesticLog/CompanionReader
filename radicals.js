/* =========================
   RADICALS
========================= */
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Comprehensive radical list with stroke counts
const RADICALS = [
  {r:'一',s:1},{r:'丨',s:1},{r:'丶',s:1},{r:'ノ',s:1},{r:'乙',s:1},{r:'亅',s:1},
  {r:'二',s:2},{r:'亠',s:2},{r:'人',s:2},{r:'儿',s:2},{r:'入',s:2},{r:'八',s:2},{r:'冂',s:2},{r:'冖',s:2},{r:'冫',s:2},{r:'几',s:2},{r:'凵',s:2},{r:'刀',s:2},{r:'力',s:2},{r:'勹',s:2},{r:'匕',s:2},{r:'匚',s:2},{r:'十',s:2},{r:'卜',s:2},{r:'卩',s:2},{r:'厂',s:2},{r:'厶',s:2},{r:'又',s:2},
  {r:'口',s:3},{r:'囗',s:3},{r:'土',s:3},{r:'士',s:3},{r:'夂',s:3},{r:'夕',s:3},{r:'大',s:3},{r:'女',s:3},{r:'子',s:3},{r:'宀',s:3},{r:'寸',s:3},{r:'小',s:3},{r:'尢',s:3},{r:'尸',s:3},{r:'屮',s:3},{r:'山',s:3},{r:'川',s:3},{r:'工',s:3},{r:'己',s:3},{r:'巾',s:3},{r:'干',s:3},{r:'幺',s:3},{r:'广',s:3},{r:'廴',s:3},{r:'廾',s:3},{r:'弋',s:3},{r:'弓',s:3},{r:'彐',s:3},{r:'彡',s:3},{r:'彳',s:3},
  {r:'心',s:4},{r:'戈',s:4},{r:'戸',s:4},{r:'手',s:4},{r:'支',s:4},{r:'攴',s:4},{r:'文',s:4},{r:'斗',s:4},{r:'斤',s:4},{r:'方',s:4},{r:'无',s:4},{r:'日',s:4},{r:'曰',s:4},{r:'月',s:4},{r:'木',s:4},{r:'欠',s:4},{r:'止',s:4},{r:'歹',s:4},{r:'殳',s:4},{r:'毋',s:4},{r:'比',s:4},{r:'毛',s:4},{r:'氏',s:4},{r:'气',s:4},{r:'水',s:4},{r:'火',s:4},{r:'爪',s:4},{r:'父',s:4},{r:'爻',s:4},{r:'片',s:4},{r:'牙',s:4},{r:'牛',s:4},{r:'犬',s:4},{r:'王',s:4},
  {r:'玄',s:5},{r:'瓜',s:5},{r:'瓦',s:5},{r:'甘',s:5},{r:'生',s:5},{r:'用',s:5},{r:'田',s:5},{r:'疋',s:5},{r:'疒',s:5},{r:'白',s:5},{r:'皮',s:5},{r:'皿',s:5},{r:'目',s:5},{r:'矛',s:5},{r:'矢',s:5},{r:'石',s:5},{r:'示',s:5},{r:'禸',s:5},{r:'禾',s:5},{r:'穴',s:5},{r:'立',s:5},{r:'网',s:5},{r:'羊',s:5},{r:'羽',s:5},{r:'老',s:5},{r:'而',s:5},{r:'耒',s:5},{r:'耳',s:5},{r:'聿',s:5},{r:'肉',s:5},{r:'臣',s:5},{r:'自',s:5},{r:'至',s:5},{r:'臼',s:5},{r:'舌',s:5},{r:'舛',s:5},{r:'舟',s:5},{r:'艮',s:5},{r:'色',s:5},{r:'艸',s:5},{r:'虍',s:5},{r:'虫',s:5},{r:'血',s:5},{r:'行',s:5},{r:'衣',s:5},{r:'見',s:5},
  {r:'角',s:7},{r:'言',s:7},{r:'谷',s:7},{r:'豆',s:7},{r:'豕',s:7},{r:'貝',s:7},{r:'赤',s:7},{r:'走',s:7},{r:'足',s:7},{r:'身',s:7},{r:'車',s:7},{r:'辛',s:7},{r:'辰',s:7},{r:'邑',s:7},{r:'酉',s:7},{r:'釆',s:7},{r:'里',s:7},
  {r:'金',s:8},{r:'長',s:8},{r:'門',s:8},{r:'隶',s:8},{r:'隹',s:8},{r:'雨',s:8},{r:'青',s:8},{r:'非',s:8},
  {r:'面',s:9},{r:'革',s:9},{r:'韋',s:9},{r:'音',s:9},{r:'頁',s:9},{r:'風',s:9},{r:'飛',s:9},{r:'食',s:9},{r:'首',s:9},{r:'香',s:9},
  {r:'馬',s:10},{r:'骨',s:10},{r:'高',s:10},{r:'鬼',s:10},
  {r:'魚',s:11},{r:'鳥',s:11},{r:'鹵',s:11},{r:'鹿',s:11},{r:'麦',s:11},
  {r:'黒',s:12},{r:'鼠',s:13},{r:'鼻',s:14},{r:'歯',s:15},
];

const strokeCounts = [...new Set(RADICALS.map(r => r.s))].sort((a,b)=>a-b);
let strokeFilter = null;

function renderRadicals() {
  const sf = document.getElementById('stroke-filter');
  if (sf.children.length) return;

  const allBtn = document.createElement('button');
  allBtn.className = 'stroke-btn active';
  allBtn.textContent = 'All';
  allBtn.onclick = () => { strokeFilter = null; highlightStroke(allBtn); renderRadicalGrid(); };
  sf.appendChild(allBtn);

  strokeCounts.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'stroke-btn';
    btn.textContent = s;
    btn.onclick = () => { strokeFilter = s; highlightStroke(btn); renderRadicalGrid(); };
    sf.appendChild(btn);
  });

  renderRadicalGrid();
}

function highlightStroke(el) {
  document.querySelectorAll('.stroke-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function renderRadicalGrid() {
  const grid = document.getElementById('radical-grid');
  grid.innerHTML = '';
  const filtered = strokeFilter ? RADICALS.filter(r => r.s === strokeFilter) : RADICALS;

  filtered.forEach(({r, s}) => {
    const btn = document.createElement('button');
    btn.className = 'radical-btn' + (selectedRadicals.has(r) ? ' selected' : '');
    btn.innerHTML = `${escapeHTML(r)}<span class="strokes">${s}</span>`;
    btn.title = `${r} (${s} strokes)`;
    btn.onclick = () => toggleRadical(r, btn);
    grid.appendChild(btn);
  });
}

function toggleRadical(r, btn) {
  if (selectedRadicals.has(r)) { selectedRadicals.delete(r); btn.classList.remove('selected'); }
  else { selectedRadicals.add(r); btn.classList.add('selected'); }
  const disp = document.getElementById('selected-radicals-display');
  disp.textContent = selectedRadicals.size ? [...selectedRadicals].join(' ') : '—';
}

function clearRadicals() {
  selectedRadicals.clear();
  renderRadicalGrid();
  document.getElementById('selected-radicals-display').textContent = '—';
  document.getElementById('radical-results').innerHTML = '<p class="status-msg">Select radicals and click Search.</p>';
}

async function searchByRadicals() {
  if (!selectedRadicals.size) { alert('Select at least one radical.'); return; }
  const q = '#radical:' + [...selectedRadicals].join('');
  const res = document.getElementById('radical-results');
  res.innerHTML = '<p class="status-msg">Searching…</p>';
  try {
    const r = await fetch(JISHO_ENDPOINT + encodeURIComponent(q));
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    renderRadicalResults(data.data || []);
  } catch(e) {
    res.innerHTML = `<p class="status-msg">Search on Jisho:
      <a href="https://jisho.org/search/${encodeURIComponent(q)}" target="_blank" rel="noopener" style="color:var(--red)">
        ${escapeHTML([...selectedRadicals].join(''))} ↗
      </a></p>`;
  }
}

function renderRadicalResults(entries) {
  const res = document.getElementById('radical-results');
  const q = '#radical:' + [...selectedRadicals].join('');

  if (!entries.length) {
    res.innerHTML = `<p class="status-msg">No direct results.
      <a href="https://jisho.org/search/${encodeURIComponent(q)}" target="_blank" rel="noopener" style="color:var(--red)">Try on Jisho ↗</a></p>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';

  entries.slice(0,20).forEach(e => {
    const word = e.japanese[0]?.word || e.japanese[0]?.reading || '';
    const reading = e.japanese[0]?.reading || '';
    const meaning = e.senses[0]?.english_definitions?.slice(0,2).join(', ') || '';

    const tile = document.createElement('div');
    tile.style.cssText = "background:var(--white);border:1px solid var(--border);border-radius:2px;padding:8px 12px;cursor:pointer;min-width:80px;text-align:center";
    tile.innerHTML = `
      <div style="font-family:'Noto Serif JP',serif;font-size:1.4rem;font-weight:700">${escapeHTML(word)}</div>
      <div style="font-size:0.75rem;color:var(--muted)">${word!==reading ? escapeHTML(reading) : ''}</div>
      <div style="font-size:0.75rem;color:var(--ink);margin-top:2px">${escapeHTML(meaning).slice(0, 28)}</div>
    `;
    tile.addEventListener('click', () => {
      document.getElementById('search-input').value = word;
      showPanel('lookup');
      lookupWord();
    });
    wrap.appendChild(tile);
  });

  res.innerHTML = '';
  res.appendChild(wrap);

  const p = document.createElement('p');
  p.style.cssText = "font-size:0.8rem;color:var(--muted);margin-top:10px;font-style:italic";
  p.innerHTML = `Click any kanji to look it up. <a href="https://jisho.org/search/${encodeURIComponent(q)}" target="_blank" rel="noopener" style="color:var(--red)">See all on Jisho ↗</a>`;
  res.appendChild(p);
}
