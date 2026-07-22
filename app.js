let audioContext, analyser, dataArray, canvas, ctx, stream, rafId;

// ------- Afinaciones disponibles -------
const tunings = {
  standard: {
    label: "Estándar",
    strings: [
      { note: "E2", freq: 82.41 },
      { note: "A2", freq: 110.00 },
      { note: "D3", freq: 146.83 },
      { note: "G3", freq: 196.00 },
      { note: "B3", freq: 246.94 },
      { note: "E4", freq: 329.63 }
    ]
  },
  dropD: {
    label: "Drop D",
    strings: [
      { note: "D2", freq: 73.42 },
      { note: "A2", freq: 110.00 },
      { note: "D3", freq: 146.83 },
      { note: "G3", freq: 196.00 },
      { note: "B3", freq: 246.94 },
      { note: "E4", freq: 329.63 }
    ]
  },
  halfStepDown: {
    label: "½ tono abajo",
    strings: [
      { note: "Eb2", freq: 77.78 },
      { note: "Ab2", freq: 103.83 },
      { note: "Db3", freq: 138.59 },
      { note: "Gb3", freq: 185.00 },
      { note: "Bb3", freq: 233.08 },
      { note: "Eb4", freq: 311.13 }
    ]
  },
  dropCSharp: {
    label: "Drop C#",
    strings: [
      { note: "C#2", freq: 69.30 },
      { note: "G#2", freq: 103.83 },
      { note: "C#3", freq: 138.59 },
      { note: "F#3", freq: 185.00 },
      { note: "A#3", freq: 233.08 },
      { note: "D#4", freq: 311.13 }
    ]
  },
  wholeStepDown: {
    label: "1 tono abajo",
    strings: [
      { note: "D2", freq: 73.42 },
      { note: "G2", freq: 98.00 },
      { note: "C3", freq: 130.81 },
      { note: "F3", freq: 174.61 },
      { note: "A3", freq: 220.00 },
      { note: "D4", freq: 293.66 }
    ]
  },
  dropC: {
    label: "Drop C",
    strings: [
      { note: "C2", freq: 65.41 },
      { note: "G2", freq: 98.00 },
      { note: "C3", freq: 130.81 },
      { note: "F3", freq: 174.61 },
      { note: "A3", freq: 220.00 },
      { note: "D4", freq: 293.66 }
    ]
  }
};

let currentTuningKey = "standard";
let lockedIndex = null; // índice de cuerda fijada manualmente, o null = detección automática

function getCurrentStrings() {
  return tunings[currentTuningKey].strings;
}

// ------- Colores según precisión (en cents) -------
function colorForCents(cents) {
  const abs = Math.abs(cents);
  if (abs < 5) return "#00ff99";
  if (abs < 15) return "#ffaa00";
  return "#ff4444";
}

// ------- Render de las 6 cuerdas (siempre visibles, antes de iniciar el mic) -------
function renderStringsRow() {
  const row = document.getElementById("stringsRow");
  row.innerHTML = "";
  getCurrentStrings().forEach((s, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "string-btn";
    btn.dataset.index = i;
    btn.setAttribute("aria-pressed", lockedIndex === i ? "true" : "false");
    btn.innerHTML = `<span class="string-num">${i + 1}ª</span><span class="string-note">${s.note}</span>`;
    if (lockedIndex === i) btn.classList.add("locked");
    btn.addEventListener("click", () => {
      lockedIndex = (lockedIndex === i) ? null : i;
      renderStringsRow();
    });
    row.appendChild(btn);
  });
  updateHint();
}

function updateHint() {
  const hint = document.getElementById("hint");
  if (!hint) return;
  hint.innerText = lockedIndex !== null
    ? `Cuerda fijada: ${getCurrentStrings()[lockedIndex].note}. Tocala de nuevo para volver al modo automático.`
    : "Elegí una cuerda para fijarla, o tocá cualquiera: el afinador la detecta sola.";
}

function highlightDetected(index) {
  document.querySelectorAll(".string-btn").forEach((btn, i) => {
    btn.classList.toggle("detected", i === index);
  });
}

function resetDisplay() {
  document.getElementById("note").innerText = "-";
  document.getElementById("freq").innerText = "0 Hz";
  document.getElementById("cents").innerText = "";
  document.querySelectorAll(".string-btn").forEach(btn => btn.classList.remove("detected"));
  displayCents = 0;
  displayFreq = null;
  pendingIdx = null;
  pendingCount = 0;
  if (ctx) drawMeter(0, true);
}

// ------- Selector de afinación -------
function selectTuning(key) {
  currentTuningKey = key;
  lockedIndex = null;
  document.querySelectorAll(".tuning-chip").forEach(b => {
    b.classList.toggle("active", b.dataset.tuning === key);
    b.setAttribute("aria-pressed", b.dataset.tuning === key ? "true" : "false");
  });
  renderStringsRow();
  resetDisplay();
}

// ------- Encender / apagar el micrófono -------
async function startTuner() {
  const boton = document.getElementById("boton");

  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    if (audioContext) audioContext.close();
    if (rafId) cancelAnimationFrame(rafId);
    boton.classList.remove("active");
    resetDisplay();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    alert("No se pudo acceder al micrófono. Revisá los permisos del navegador e intentá de nuevo.");
    return;
  }

  boton.classList.add("active");

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Float32Array(analyser.fftSize);
  source.connect(analyser);

  canvas = document.getElementById("tunerCanvas");
  ctx = canvas.getContext("2d");

  detectPitch();
}

let stableIdx = 0;    // cuerda que se muestra actualmente (estable)
let pendingIdx = null; // candidata a reemplazarla
let pendingCount = 0;
const STABILITY_FRAMES = 5; // frames seguidos que tiene que "ganar" antes de cambiar

function getTarget(freq) {
  const strings = getCurrentStrings();
  if (lockedIndex !== null) {
    stableIdx = lockedIndex;
    pendingIdx = null;
    pendingCount = 0;
    return { idx: lockedIndex, note: strings[lockedIndex].note, freq: strings[lockedIndex].freq };
  }

  let bestIdx = 0, bestDiff = Infinity;
  strings.forEach((s, i) => {
    const d = Math.abs(s.freq - freq);
    if (d < bestDiff) { bestDiff = d; bestIdx = i; }
  });

  if (bestIdx === stableIdx) {
    pendingCount = 0;
  } else if (bestIdx === pendingIdx) {
    pendingCount++;
    if (pendingCount >= STABILITY_FRAMES) {
      stableIdx = bestIdx;
      pendingCount = 0;
    }
  } else {
    pendingIdx = bestIdx;
    pendingCount = 1;
  }

  return { idx: stableIdx, note: strings[stableIdx].note, freq: strings[stableIdx].freq };
}

let displayCents = 0;
let displayFreq = null;
const SMOOTHING = 0.18; // más bajo = más suave (y más lag), más alto = más reactivo

function detectPitch() {
  analyser.getFloatTimeDomainData(dataArray);
  const freq = autoCorrelate(dataArray, audioContext.sampleRate);

  if (freq !== -1) {
    const target = getTarget(freq);
    const rawCents = 1200 * Math.log2(freq / target.freq);

    // suavizado exponencial: la aguja y el Hz se deslizan en vez de saltar
    displayCents += (rawCents - displayCents) * SMOOTHING;
    displayFreq = displayFreq === null ? freq : displayFreq + (freq - displayFreq) * SMOOTHING;

    document.getElementById("note").innerText = target.note;
    document.getElementById("freq").innerText = displayFreq.toFixed(1) + " Hz";
    document.getElementById("note").style.color = colorForCents(displayCents);

    const centsEl = document.getElementById("cents");
    centsEl.innerText = (displayCents > 0 ? "+" : "") + displayCents.toFixed(0) + " cents";
    centsEl.style.color = colorForCents(displayCents);

    highlightDetected(target.idx);
    drawMeter(displayCents);
  } else {
    // sin señal: la aguja vuelve suavemente al centro en vez de quedar clavada
    displayCents *= 0.85;
    drawMeter(displayCents, Math.abs(displayCents) < 0.3);
  }
  rafId = requestAnimationFrame(detectPitch);
}

// ------- Medidor visual (gauge en cents, -50 a +50) -------
function drawMeter(cents, idle) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width, h = canvas.height;
  const barY = h / 2;
  const barX1 = 30, barX2 = w - 30;
  const range = 50; // cents visibles a cada lado

  // Fondo de la barra
  ctx.beginPath();
  ctx.moveTo(barX1, barY);
  ctx.lineTo(barX2, barY);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#2a3246";
  ctx.lineCap = "round";
  ctx.stroke();

  // Zona "afinado" en el centro
  const centerWidth = (barX2 - barX1) * (5 / range) / 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - centerWidth, barY);
  ctx.lineTo(w / 2 + centerWidth, barY);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#2f6b52";
  ctx.stroke();

  // Marca central
  ctx.beginPath();
  ctx.moveTo(w / 2, barY - 14);
  ctx.lineTo(w / 2, barY + 14);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#555";
  ctx.stroke();

  if (idle) return;

  // Aguja
  const clamped = Math.max(-range, Math.min(range, cents));
  const posX = w / 2 + (clamped / range) * (w / 2 - 30);
  const color = colorForCents(cents);

  ctx.beginPath();
  ctx.arc(posX, barY, 11, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(posX, barY - 26);
  ctx.lineTo(posX, barY + 26);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  let c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }

  let T0 = maxpos;
  return sampleRate / T0;
}

// ------- Inicialización -------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tuning-chip").forEach(b => {
    b.addEventListener("click", () => selectTuning(b.dataset.tuning));
  });
  renderStringsRow();

  canvas = document.getElementById("tunerCanvas");
  ctx = canvas.getContext("2d");
  drawMeter(0, true);
});