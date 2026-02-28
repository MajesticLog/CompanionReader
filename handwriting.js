/* =========================
   HANDWRITING + CANVAS
   - Drawing canvas
   - Stroke capture
   - Recognize via Google Input Tools
========================= */

// Canvas + drawing state (globals because HTML uses onclick handlers)
const canvas = document.getElementById('writing-canvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let mode = 'draw';
let lastX = 0, lastY = 0;

// Strokes for handwriting recognition
let strokes = [];
let currentStroke = null;

function nowMs() { return performance.now(); }

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return [src.clientX - r.left, src.clientY - r.top];
}

function drawGrid() {
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  ctx.moveTo(w/2,0); ctx.lineTo(w/2,h);
  ctx.moveTo(0,h/2); ctx.lineTo(w,h/2);
  ctx.moveTo(0,0); ctx.lineTo(w,h);
  ctx.moveTo(w,0); ctx.lineTo(0,h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function clearCanvas(keepGrid = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (keepGrid) drawGrid();
}

function resizeCanvas() {
  // Make it responsive but keep reasonable limits
  const wrap = canvas.parentElement;
  const w = Math.max(280, Math.min((wrap?.clientWidth || 480) - 44, 520));
  const prev = { w: canvas.width, h: canvas.height };

  // If we resize, we lose drawing. We intentionally clear to avoid distortion.
  canvas.width = Math.round(w);
  canvas.height = Math.round(w * 0.78);

  clearCanvas(true);

  // Reset stroke capture (avoids mismatched coords)
  strokes = [];
  currentStroke = null;

  // Update UI text if present
  const status = document.getElementById("hw-status");
  const out = document.getElementById("hw-candidates");
  if (status) status.textContent = "Draw a kanji, then click Recognize.";
  if (out) out.innerHTML = "";
}

function startDraw(e) {
  drawing = true;
  const [x, y] = getPos(e);

  currentStroke = [{ x, y, t: nowMs() }];
  strokes.push(currentStroke);

  lastX = x; lastY = y;
  e.preventDefault();
}

function endDraw() {
  drawing = false;
  ctx.beginPath();
  currentStroke = null;
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const [x, y] = getPos(e);

  ctx.globalCompositeOperation = (mode === 'erase') ? 'destination-out' : 'source-over';
  ctx.strokeStyle = (mode === 'erase') ? 'rgba(0,0,0,1)' : document.getElementById('brush-color').value;
  ctx.lineWidth = +document.getElementById('brush-size').value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  lastX = x; lastY = y;

  // Record points for recognition
  // If currentStroke is null (edge case), start a new stroke
  if (!currentStroke) {
    currentStroke = [{ x, y, t: nowMs() }];
    strokes.push(currentStroke);
  } else {
    currentStroke.push({ x, y, t: nowMs() });
  }
}

// Attach listeners once
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', endDraw);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchend', endDraw, { passive: false });
canvas.addEventListener('touchcancel', endDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });

// UI helpers used by buttons
function setBrushMode(m) { mode = m; }

function downloadCanvas() {
  const a = document.createElement('a');
  a.download = 'kanji-practice.png';
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function clearInk() {
  strokes = [];
  currentStroke = null;
  clearCanvas(true);

  const out = document.getElementById("hw-candidates");
  const status = document.getElementById("hw-status");
  if (out) out.innerHTML = "";
  if (status) status.textContent = "Draw a kanji, then click Recognize.";
}

// --- Handwriting recognition (Google Input Tools) ---
async function recognizeHandwriting() {
  const status = document.getElementById("hw-status");
  const out = document.getElementById("hw-candidates");

  const usable = strokes.filter(st => st && st.length >= 2);
  if (!usable.length) {
    if (status) status.textContent = "Draw a kanji first 🙂";
    if (out) out.innerHTML = "";
    return;
  }

  if (status) status.textContent = "Recognizing…";
  if (out) out.innerHTML = "";

  // Convert strokes into the format expected by Google:
  const ink = usable.map(st => ([
    st.map(p => Math.round(p.x)),
    st.map(p => Math.round(p.y)),
  ]));

  const payload = JSON.stringify([
    "ja",
    [canvas.width, canvas.height],
    ink,
    0,
    0
  ]);

  try {
    const r = await fetch(
      "https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }
    );

    const data = await r.json();
    if (!Array.isArray(data) || data[0] !== "SUCCESS") {
      if (status) status.textContent = "No result. Try writing larger / clearer.";
      return;
    }

    const candidates = data?.[1]?.[0]?.[1] || [];
    if (!candidates.length) {
      if (status) status.textContent = "No candidates returned. Try again.";
      return;
    }

    if (status) status.textContent = "Pick the correct kanji:";
    candidates.slice(0, 12).forEach(c => {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline";
      btn.textContent = c;
      btn.style.fontFamily = "'Noto Serif JP', serif";
      btn.onclick = () => {
        document.getElementById("search-input").value = c;
        showPanel("lookup");
        lookupWord();
      };
      out.appendChild(btn);
    });
  } catch (e) {
    if (status) status.textContent = "Recognition failed (network blocked). Try again, or use radicals.";
  }
}

