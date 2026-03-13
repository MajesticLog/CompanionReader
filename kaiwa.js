/* =========================
   KAIWA — 会話 Practice
   Chat in Japanese with AI conversation partner
========================= */

const KAIWA_API = (window.TSUNDOKU_CONFIG && window.TSUNDOKU_CONFIG.kaiwaApi)
  || 'https://minireader.zoe-caudron.workers.dev/kaiwa';

/* ── State ─────────────────────────────────────────── */
const kaiwa = {
  level: null,          // 'n5'|'n4'|'n3'|'n2'|'n1'|'beginner'|'intermediate'|'advanced'|'auto'
  topic: null,          // optional scenario
  messages: [],         // { role:'user'|'assistant', content:'' }
  loading: false,
  sessionActive: false,
};

/* ── Level / topic metadata ──────────────────────── */
const KW_LEVELS = [
  { id: 'auto',         label: 'おまかせ - Adapted to you', desc: 'Write freely and the AI will match your level' },
  { id: 'beginner',     label: '初級 Beginner',   desc: 'Simple greetings, self-intro, daily life (～N5)' },
  { id: 'intermediate', label: '中級 Intermediate', desc: 'Opinions, experiences, plans (～N4–N3)' },
  { id: 'advanced',     label: '上級 Advanced',    desc: 'Abstract topics, nuance, formal speech (～N2–N1)' },
  { group: 'JLPT' },
  { id: 'n5', label: 'N5', desc: 'Basic phrases, self-introduction' },
  { id: 'n4', label: 'N4', desc: 'Daily conversation, simple opinions' },
  { id: 'n3', label: 'N3', desc: 'Everyday topics, explanations' },
  { id: 'n2', label: 'N2', desc: 'Abstract discussion, news, work' },
  { id: 'n1', label: 'N1', desc: 'Complex arguments, formal, literary' },
];

const KW_TOPICS = [
  { id: null,           label: 'Free conversation' },
  { id: 'jikoshoukai',  label: '自己紹介 Self-introduction' },
  { id: 'kaimono',      label: '買い物 Shopping' },
  { id: 'restaurant',   label: 'レストラン Restaurant' },
  { id: 'travel',       label: '旅行 Travel' },
  { id: 'hobby',        label: '趣味 Hobbies' },
  { id: 'work',         label: '仕事 Work / School' },
  { id: 'opinion',      label: '意見 Sharing opinions' },
  { id: 'directions',   label: '道案内 Asking directions' },
];

/* ── Init / render setup ──────────────────────────── */
function initKaiwa() {
  if (kaiwa.sessionActive) return;               // don't re-render setup if mid-chat
  const root = document.getElementById('kw-root');
  if (!root) return;
  renderKaiwaSetup();
}

function renderKaiwaSetup() {
  kaiwa.sessionActive = false;
  kaiwa.messages = [];
  kaiwa.level = null;
  kaiwa.topic = null;

  const root = document.getElementById('kw-root');
  if (!root) return;

  root.innerHTML = `
    <div class="card kw-setup-card" style="max-width:600px;margin:0 auto">
      <h2>会話 — Conversation Practice</h2>
      <p class="kw-setup-intro">
        Chat in Japanese. Pick your level, choose an optional topic, and start writing.
        Your AI partner will reply in Japanese, then gently correct any mistakes.
      </p>

      <div class="kw-level-section">
        <label class="kw-label">Level</label>
        <div class="kw-level-grid" id="kw-level-grid">
          ${KW_LEVELS.map(l => {
            if (l.group) return `<div class="kw-level-group-label">${kwEsc(l.group)}</div>`;
            return `<button class="kw-level-btn" data-level="${l.id}" onclick="kwSelectLevel('${l.id}', this)" type="button">
              <span class="kw-level-name">${kwEsc(l.label)}</span>
              <span class="kw-level-desc">${kwEsc(l.desc)}</span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div class="kw-topic-section" id="kw-topic-section" style="display:none">
        <label class="kw-label">Topic <span style="opacity:0.5;font-weight:300">(optional)</span></label>
        <div class="kw-topic-row">
          ${KW_TOPICS.map(t => `<button class="kw-topic-btn${t.id === null ? ' active' : ''}" data-topic="${t.id || ''}" onclick="kwSelectTopic(${t.id ? `'${t.id}'` : 'null'}, this)" type="button">${kwEsc(t.label)}</button>`).join('')}
        </div>
      </div>

      <div class="kw-start-row" id="kw-start-row" style="display:none">
        <button class="btn kw-start-btn" onclick="kwStartSession()" type="button">Start chatting →</button>
      </div>
    </div>`;
}

/* ── Setup interactions ───────────────────────────── */
function kwSelectLevel(id, btn) {
  kaiwa.level = id;
  document.querySelectorAll('.kw-level-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('kw-topic-section').style.display = '';
  document.getElementById('kw-start-row').style.display = '';
}

function kwSelectTopic(id, btn) {
  kaiwa.topic = id;
  document.querySelectorAll('.kw-topic-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* ── Start session ────────────────────────────────── */
function kwStartSession() {
  if (!kaiwa.level) return;
  kaiwa.sessionActive = true;
  kaiwa.messages = [];

  const root = document.getElementById('kw-root');
  if (!root) return;

  root.innerHTML = `
    <div class="kw-chat-wrap">
      <div class="kw-chat-header">
        <button class="btn btn-sm btn-outline kw-back-btn" onclick="kwConfirmEnd()" type="button">← End</button>
        <span class="kw-chat-title">会話 — ${kwLevelLabel(kaiwa.level)}${kaiwa.topic ? ' · ' + kwTopicLabel(kaiwa.topic) : ''}</span>
      </div>
      <div class="kw-messages" id="kw-messages">
        <div class="kw-system-msg">
          Say something in Japanese to start! Your partner will respond and help you improve.<br>
          <span style="opacity:0.5;font-size:0.78rem">Tip: you can write in romaji too — it understands either way.</span>
        </div>
      </div>
      <div class="kw-input-bar" id="kw-input-bar">
        <textarea class="kw-input" id="kw-input" rows="2" placeholder="日本語で話しましょう…" autocomplete="off"></textarea>
        <button class="btn kw-send-btn" id="kw-send-btn" onclick="kwSend()" type="button">送信</button>
      </div>
    </div>`;

  const input = document.getElementById('kw-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kwSend(); }
    });
    input.focus();
  }
}

/* ── Send message ─────────────────────────────────── */
async function kwSend() {
  if (kaiwa.loading) return;
  const input = document.getElementById('kw-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  // Add user message
  kaiwa.messages.push({ role: 'user', content: text });
  kwAppendBubble('user', text);
  input.value = '';
  input.style.height = 'auto';

  // Show typing indicator
  kaiwa.loading = true;
  kwSetSendEnabled(false);
  const typingEl = kwAppendTyping();

  try {
    const resp = await fetch(KAIWA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: kaiwa.messages,
        level: kaiwa.level,
        topic: kaiwa.topic,
      }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const reply = data.reply || 'すみません、エラーが発生しました。もう一度試してください。';

    kaiwa.messages.push({ role: 'assistant', content: reply });
    typingEl.remove();
    kwAppendAssistant(reply);
  } catch (e) {
    console.error('Kaiwa error:', e);
    typingEl.remove();
    kwAppendBubble('system', '⚠️ Connection error — please try again.');
  } finally {
    kaiwa.loading = false;
    kwSetSendEnabled(true);
    document.getElementById('kw-input')?.focus();
  }
}

/* ── Render helpers ───────────────────────────────── */
function kwAppendBubble(role, text) {
  const wrap = document.getElementById('kw-messages');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = `kw-bubble kw-bubble-${role}`;
  div.innerHTML = `<div class="kw-bubble-inner">${kwFormatText(text)}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

function kwAppendAssistant(raw) {
  const wrap = document.getElementById('kw-messages');
  if (!wrap) return;

  // Split reply into conversation + correction sections
  const { conversation, correction } = kwParseReply(raw);

  const div = document.createElement('div');
  div.className = 'kw-bubble kw-bubble-assistant';

  let html = `<div class="kw-bubble-inner kw-conversation">${kwFormatText(conversation)}</div>`;
  if (correction) {
    html += `<div class="kw-correction">
      <div class="kw-correction-label">📝 Corrections & Notes</div>
      <div class="kw-correction-body">${kwFormatText(correction)}</div>
    </div>`;
  }

  div.innerHTML = html;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function kwAppendTyping() {
  const wrap = document.getElementById('kw-messages');
  if (!wrap) return document.createElement('div');
  const div = document.createElement('div');
  div.className = 'kw-bubble kw-bubble-assistant kw-typing';
  div.innerHTML = `<div class="kw-bubble-inner"><span class="kw-dot"></span><span class="kw-dot"></span><span class="kw-dot"></span></div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

function kwSetSendEnabled(enabled) {
  const btn = document.getElementById('kw-send-btn');
  if (btn) btn.disabled = !enabled;
}

/* ── Parse AI reply into conversation + correction ─── */
function kwParseReply(raw) {
  // The AI is instructed to use a separator like ---correction--- or 【添削】
  const separators = [
    /\n---\s*correct(?:ion|ions)?\s*---\n/i,
    /\n【添削】\n/,
    /\n【訂正】\n/,
    /\n---\s*notes?\s*---\n/i,
    /\n📝\s*/,
  ];

  for (const sep of separators) {
    const idx = raw.search(sep);
    if (idx > -1) {
      const match = raw.match(sep);
      return {
        conversation: raw.slice(0, idx).trim(),
        correction: raw.slice(idx + match[0].length).trim(),
      };
    }
  }

  return { conversation: raw.trim(), correction: '' };
}

/* ── Text formatting ──────────────────────────────── */
function kwFormatText(text) {
  // Escape HTML, then restore line breaks and basic formatting
  let s = kwEsc(text);
  s = s.replace(/\n/g, '<br>');
  // Bold: **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough for corrections: ~~wrong~~ → right
  s = s.replace(/~~(.+?)~~/g, '<span class="kw-strike">$1</span>');
  return s;
}

/* ── End session ──────────────────────────────────── */
function kwConfirmEnd() {
  if (kaiwa.messages.length > 0) {
    if (!confirm('End this conversation? Your chat history will be cleared.')) return;
  }
  renderKaiwaSetup();
}

/* ── Utility ──────────────────────────────────────── */
function kwEsc(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function kwLevelLabel(id) {
  const l = KW_LEVELS.find(l => l.id === id);
  return l ? l.label : id;
}

function kwTopicLabel(id) {
  const t = KW_TOPICS.find(t => t.id === id);
  return t ? t.label : '';
}

window.initKaiwa = initKaiwa;
window.kwSelectLevel = kwSelectLevel;
window.kwSelectTopic = kwSelectTopic;
window.kwStartSession = kwStartSession;
window.kwSend = kwSend;
window.kwConfirmEnd = kwConfirmEnd;
