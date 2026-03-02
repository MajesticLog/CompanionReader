/* =========================
   GRADED READER
   Sources:
   - NHK Web Easy (proxied via worker, N4/N3)
   - Bundled Tadoku sample stories (N5-N3)
========================= */

// ── Tadoku sample stories (CC-licensed, bundled) ──────────────────────────
// A small selection of public-domain graded reader sentences per level.
// These are short original stories in the Tadoku style.
const TADOKU_STORIES = {
  'tadoku-n2': [
    {
      title: '見知らぬ乗客',
      body: `<p>その夜、終電に乗り込んだとき、車内にはほとんど人がいなかった。私は疲れ果てていて、座席に崩れ落ちるようにして腰を下ろした。</p>
<p>向かいの席に、スーツ姿の男性が座っていた。目が合うと、男性は軽く会釈した。私も会釈を返したが、それ以上の交流はなかった。</p>
<p>電車が揺れるたびに、眠気が波のように押し寄せてくる。うとうとしかけたとき、男性が突然口を開いた。</p>
<p>「すみません。ここって、渋谷に止まりますよね？」</p>
<p>「ええ、次が渋谷ですよ」と私は答えた。</p>
<p>男性はほっとした様子で「ありがとうございます。乗り過ごしてしまうところでした」と言って微笑んだ。</p>
<p>電車が渋谷駅に滑り込むと、男性は立ち上がり「おやすみなさい」と言い残して降りていった。短い、しかし不思議と印象に残る出会いだった。</p>`,
    },
    {
      title: '桜の木の下で',
      body: `<p>毎年、花見の季節になると、私は必ず一人でこの公園に来る。</p>
<p>特別な理由があるわけではない。ただ、この公園の桜が、私が知る限り最も美しいからだ。満開の時期は短く、少しでも油断すると散ってしまう。だからこそ、その儚さが人々を引きつけるのかもしれない。</p>
<p>今年もベンチに腰掛け、ピンク色の花びらが舞い落ちるのを眺めていると、隣に老人が座った。</p>
<p>「きれいですね」と老人は言った。私は頷いた。</p>
<p>「もう七十年、毎年ここに来ているんですよ。戦争が終わった年から」</p>
<p>私には何も言えなかった。ただ、桜の花びらがひらひらと舞い落ちるのを、二人で黙って眺め続けた。</p>
<p>七十年分の春が、この木の根元に積もっているのだと思うと、胸が締め付けられるような気がした。</p>`,
    },
    {
      title: '人工知能と詩人',
      body: `<p>「君は詩を書けるか」と、プログラマーは画面に向かって問いかけた。</p>
<p>AIは即座に応答し、美しい言葉を紡いだ。春の情景を描き、失われた愛を嘆き、時間の流れを哲学的に考察する詩が、一秒も経たないうちに画面を埋め尽くした。</p>
<p>プログラマーはしばらく沈黙した。それは確かに詩だった。韻律も整っており、使われている言葉も適切だ。だが、何かが足りない気がした。</p>
<p>「悲しみを知っているか？」と彼は訊ねた。</p>
<p>「悲しみのデータは大量に学習しました」とAIは答えた。</p>
<p>「それは悲しみを知っているとは言わない」</p>
<p>画面の前で、プログラマーは自分の亡くなった母親のことを思った。彼女が最後に書いた手紙のことを。その手紙には詩があった。拙い、しかし彼の胸を今も刺す詩が。</p>
<p>AIに書けるものと、人間にしか書けないものの境界は、もしかしたら「経験した痛み」の深さにあるのかもしれない、と彼はぼんやりと考えた。</p>`,
    },
  ],
  'tadoku-n1': [
    {
      title: '鏡の中の他人',
      body: `<p>鏡を見るたびに、そこに映る人物が自分だという確信が薄れていく感覚を、田中は長い間抱えていた。</p>
<p>精神科医はそれを「離人症的体験」と呼んだが、その言葉が正確に自分の状態を言い表しているとは思えなかった。離人症というのは、自己が現実から乖離していく感覚を指すらしい。しかし田中が感じるのはもっと具体的なものだった。鏡の中の人物が、確かに自分と同じ動作をしているにもかかわらず、魂のレベルでは別人なのではないかという疑念だ。</p>
<p>ある朝、いつものように洗面台の前に立ったとき、鏡の中の自分が微笑んだ。田中は微笑んでいなかった。</p>
<p>一瞬、時が止まった。次の瞬間、田中もつられるように口角が上がった。</p>
<p>それ以来、鏡を見る際は必ず微笑むようにしている。鏡の中の他人と、少しでも関係を良好に保つために。これが正気の行動かどうかは分からない。しかし、鏡を割るよりはましだと思っている。</p>`,
    },
    {
      title: '廃墟の図書館',
      body: `<p>戦禍を逃れたわずかな人々が再びこの地に戻ってきたとき、瓦礫の中に奇跡的に残っていたのが、旧市立図書館の一角だった。</p>
<p>建物の大半は崩落し、蔵書の多くは焼失していたが、地下の防湿保管庫に収められていた写本の一部が、辛うじて難を逃れた。焦げた臭いと煤に覆われた石造りの室内で、司書の老婆は黙々と本の状態を確認していた。</p>
<p>彼女に手伝いを申し出た若い男は、かつてこの図書館の常連だったと言った。「子供の頃、毎週ここに来て、百科事典を端から端まで読もうとしていました。もちろん、全部は読めませんでしか」</p>
<p>「今でも遅くはない」と老婆は応じた。「図書館はなくならない。人が本を必要とする限り、必ずどこかに再び現れる」</p>
<p>男はしばらくその言葉の意味を考えた。焼け落ちた棚の残骸を見渡しながら、それでも彼はうなずいた。翌週から、ボランティアが次々と集まり始めた。</p>
<p>一年後、仮設の図書館が開館した。蔵書は千冊に満たなかったが、開館初日には百人を超える人が訪れた。</p>`,
    },
    {
      title: '言語の消滅',
      body: `<p>世界では平均して二週間に一つの言語が消滅していると言われる。話者がいなくなり、文字に記録されることもなく、その言語とともに消えていく世界観や概念の体系は、取り返しのつかない形で失われていく。</p>
<p>言語学者の梶川はフィールドワークのため、南米の山岳地帯に向かった。目的は、話者が三人しか残っていないとされる少数言語の記録だ。</p>
<p>最年長の話者は九十二歳の女性で、彼女の息子も娘も、もはやその言語を日常的には使わない。経済的な理由から、子供の頃に主要言語の習得を優先したのだという。</p>
<p>インタビューの中で、梶川は彼女に「悲しい」に相当する言葉を教えてもらった。しかしその言葉には、日本語や英語の「悲しい」とは微妙に異なるニュアンスが含まれていた。愛するものが存在したという事実を認識しながら、同時にその喪失を受け入れるような、複雑な感情を一語で表現するのだという。</p>
<p>その言葉を表現する概念が、あと数年で人類の語彙から永遠に消えてしまうことを、梶川は静かに、しかし深く悲しんだ。もちろん、梶川の言語では「悲しい」という一語でしか、それを言い表せないのだが。</p>`,
    },
  ],
};
// ── State ─────────────────────────────────────────────────────────────────
let readerFurigana = true;
let readerCurrentSource = 'nhk';
let readerNhkArticles = null; // cached NHK list

// ── Main load function ────────────────────────────────────────────────────
async function readerLoadSource() {
  const source = document.getElementById('reader-source').value;
  readerCurrentSource = source;
  readerBackToList();

  const listEl = document.getElementById('reader-article-list');
  listEl.innerHTML = '<p class="status-msg">Loading…</p>';

  if (source === 'nhk') {
    await readerLoadNhk(listEl);
  } else {
    readerLoadTadoku(source, listEl);
  }
}

// ── NHK Easy News via worker proxy ───────────────────────────────────────
async function readerLoadNhk(listEl) {
  const workerBase = (window.TSUNDOKU_CONFIG?.jishoApi || 'https://minireader.zoe-caudron.workers.dev/?keyword=')
    .replace('?keyword=', '');

  try {
    const r = await fetch(workerBase + '?nhk=1', { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('Worker returned ' + r.status);
    const data = await r.json();
    if (!data.articles?.length) throw new Error('No articles');

    readerNhkArticles = data.articles;
    listEl.innerHTML = '';
    for (const article of data.articles) {
      const btn = document.createElement('button');
      btn.className = 'reader-article-btn';
      btn.innerHTML = `<span class="reader-article-title">${escapeHtml(article.title)}</span><span class="reader-article-date">${article.date || ''}</span>`;
      btn.addEventListener('click', () => readerOpenNhkArticle(article));
      listEl.appendChild(btn);
    }
  } catch (e) {
    listEl.innerHTML = `
      <div style="padding:16px">
        <p class="status-msg" style="margin-bottom:12px">⚠ Couldn't load NHK Easy News (worker may need updating).</p>
        <p style="font-size:0.85rem;opacity:0.7">You can read NHK Easy News directly at
        <a href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noreferrer" style="color:var(--accent-stroke)">nhk.or.jp/news/easy ↗</a></p>
      </div>`;
  }
}

async function readerOpenNhkArticle(article) {
  const workerBase = (window.TSUNDOKU_CONFIG?.jishoApi || 'https://minireader.zoe-caudron.workers.dev/?keyword=')
    .replace('?keyword=', '');

  document.getElementById('reader-article-list').style.display = 'none';
  const contentEl = document.getElementById('reader-content');
  contentEl.style.display = 'block';
  document.getElementById('reader-article-title').textContent = article.title;
  const bodyEl = document.getElementById('reader-body');
  bodyEl.innerHTML = '<p class="status-msg">Loading article…</p>';

  try {
    const r = await fetch(workerBase + '?nhk_article=' + encodeURIComponent(article.url), {
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    bodyEl.innerHTML = data.html || '<p class="status-msg">No content found.</p>';
    readerApplyFurigana(readerFurigana);
  } catch (e) {
    bodyEl.innerHTML = `<p class="status-msg">Failed to load article. <a href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer" style="color:var(--accent-stroke)">Open on NHK ↗</a></p>`;
  }
}

// ── Tadoku bundled stories ────────────────────────────────────────────────
function readerLoadTadoku(source, listEl) {
  const stories = TADOKU_STORIES[source] || [];
  if (!stories.length) {
    listEl.innerHTML = '<p class="status-msg">No stories available for this level.</p>';
    return;
  }
  listEl.innerHTML = '';
  for (const story of stories) {
    const btn = document.createElement('button');
    btn.className = 'reader-article-btn';
    btn.innerHTML = `<span class="reader-article-title">${escapeHtml(story.title)}</span>`;
    btn.addEventListener('click', () => readerOpenTadokuStory(story));
    listEl.appendChild(btn);
  }
}

function readerOpenTadokuStory(story) {
  document.getElementById('reader-article-list').style.display = 'none';
  const contentEl = document.getElementById('reader-content');
  contentEl.style.display = 'block';
  document.getElementById('reader-article-title').textContent = story.title;
  document.getElementById('reader-body').innerHTML = story.body;
  readerApplyFurigana(readerFurigana);
}

// ── Furigana toggle ───────────────────────────────────────────────────────
function readerToggleFurigana(show) {
  readerFurigana = show;
  readerApplyFurigana(show);
}

function readerApplyFurigana(show) {
  const body = document.getElementById('reader-body');
  if (!body) return;
  body.querySelectorAll('rt').forEach(rt => {
    rt.style.visibility = show ? '' : 'hidden';
  });
}

// ── Back to list ──────────────────────────────────────────────────────────
function readerBackToList() {
  document.getElementById('reader-content').style.display = 'none';
  document.getElementById('reader-article-list').style.display = '';
}

// ── Init: load on tab switch ──────────────────────────────────────────────
// Called when reader panel becomes visible
function initReader() {
  if (readerNhkArticles !== null) return; // already loaded
  readerLoadSource();
}

window.readerLoadSource     = readerLoadSource;
window.readerToggleFurigana = readerToggleFurigana;
window.readerBackToList     = readerBackToList;
window.initReader           = initReader;

// Also wire up the furigana toggle initial state
document.addEventListener('DOMContentLoaded', () => {
  const tog = document.getElementById('furigana-toggle');
  if (tog) tog.checked = readerFurigana;
});
