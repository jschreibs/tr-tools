// Office Sprint Randomizer — app.js

// ─── Pixel Sprite Definitions ─────────────────────────────────────────────────
// Each frame is a 2D grid: 0 = transparent, 1 = primary color, 2 = skin tone
// 8 columns × 12 rows, rendered at PIXEL_SIZE px per cell

const SPRITE_COLS = 8;
const SPRITE_ROWS = 12;
const PIXEL_SIZE  = 4;
const DARK_HIGHLIGHT  = '#000000';

// Frame A — left leg forward (stride 1)
const FRAME_A = [
  [0,0,1,1,1,1,1,0],
  [0,1,2,1,1,2,1,0],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,2,1,1,0],
  [1,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,0,1],
  [0,0,1,1,1,1,0,0],
  [0,1,1,0,0,0,0,0],
  [0,1,0,0,0,1,0,0],
  [1,1,0,0,0,1,1,0],
  [1,0,0,0,0,0,1,0],
];

// Frame B — right leg forward (stride 2)
const FRAME_B = [
  [0,0,1,1,1,1,1,0],
  [0,1,2,1,1,2,1,0],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,2,1,1,0],
  [0,0,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,0,0],
  [0,0,1,1,1,1,0,0],
  [0,0,0,0,0,1,1,0],
  [0,0,1,0,0,0,1,0],
  [0,1,1,0,0,0,1,1],
  [0,1,0,0,0,0,0,1],
];

// Finished pose — arms up
const FRAME_WIN = [
  [0,1,1,1,1,1,1,0],
  [0,1,2,1,1,2,1,0],
  [0,1,1,1,1,1,1,0],
  [0,1,1,2,2,1,1,0],
  [1,0,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,0,0],
  [0,0,1,1,1,1,0,0],
  [0,0,1,0,0,1,0,0],
  [0,0,1,0,0,1,0,0],
  [0,0,1,0,0,1,0,0],
  [0,1,1,0,0,1,1,0],
];

const FRAMES = [FRAME_A, FRAME_B, FRAME_WIN];

// ─── Wind Burst (drawn behind runner during surge) ────────────────────────────
// Horizontal speed lines that shoot leftward from the runner's back.
// Two alternating frames shift the line lengths to create a whoosh animation.
const WIND_LINES = [
  // [dy-from-center, lenFrame0, lenFrame1]
  [-14,  8, 12],
  [ -6, 18, 22],
  [  2, 24, 28],
  [ 10, 16, 20],
  [ 18,  8, 12],
];
// Each line is two pixels tall and drawn in descending opacity: white → light blue
const WIND_COLORS = ['#ffffff', '#cce8ff', '#99cfff', '#cce8ff', '#ffffff'];

function drawWindBurst(ctx, x, y, frameIdx) {
  const f = frameIdx % 2;
  WIND_LINES.forEach(([dy, len0, len1], i) => {
    const len = f === 0 ? len0 : len1;
    ctx.fillStyle = WIND_COLORS[i];
    ctx.fillRect(Math.round(x) - len, Math.round(y) + dy, len, 2);
  });
}

function drawSprite(ctx, frameIdx, x, y, primaryColor) {
  const frame = FRAMES[frameIdx];
  for (let row = 0; row < SPRITE_ROWS; row++) {
    for (let col = 0; col < SPRITE_COLS; col++) {
      const v = frame[row][col];
      if (v === 0) continue;
      ctx.fillStyle = v === 2 ? DARK_HIGHLIGHT : primaryColor;
      ctx.fillRect(
        Math.round(x) + col * PIXEL_SIZE,
        Math.round(y) + row * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    }
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

const DEFAULT_CHARACTERS = [
  { name: 'Jerome',   color: '#e74c3c' },
  { name: 'Nick',     color: '#3498db' },
  { name: 'Jeff',   color: '#2ecc71' },
  { name: 'Nathan',    color: '#f39c12' },
];

const EXTRA_COLORS = ['#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#ff5722','#795548','#607d8b'];

const state = {
  characters: DEFAULT_CHARACTERS.map(c => ({ ...c })),
  phase: 'setup',
  race: null,
};

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function renderSetup() {
  state.phase = 'setup';
  if (state.race && state.race.animHandle) {
    cancelAnimationFrame(state.race.animHandle);
    state.race = null;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="setup-layout">
      <div class="setup-panel">
        <div class="panel-header">
          <h2>Racers</h2>
          <div class="panel-actions">
            <button id="btn-add" class="btn btn-secondary" type="button">+ Add</button>
          </div>
        </div>
        <div id="character-list" class="character-list"></div>
      </div>

      <div class="setup-sidebar">
        <div class="race-preview">
          <canvas id="preview-canvas" width="240" height="160"></canvas>
        </div>
        <button id="btn-start" class="btn btn-primary btn-large" type="button">
          Start Race ▶
        </button>
        <p id="start-error" class="start-error"></p>
      </div>
    </div>
  `;

  renderCharacterList();
  bindSetupEvents();
  drawPreview();
}

function renderCharacterList() {
  const list = document.getElementById('character-list');
  if (!list) return;
  list.innerHTML = state.characters.map((c, i) => `
    <div class="character-row" data-index="${i}">
      <input type="color" class="color-swatch" value="${c.color}" data-index="${i}">
      <input type="text"  class="char-name-input" value="${escapeAttr(c.name)}" data-index="${i}" maxlength="20" placeholder="Name">
      <button class="btn-remove" data-index="${i}" type="button" aria-label="Remove racer">&#10005;</button>
    </div>
  `).join('');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function bindSetupEvents() {
  document.getElementById('btn-add').addEventListener('click', () => {
    if (state.characters.length >= 12) return;
    const color = EXTRA_COLORS[state.characters.length % EXTRA_COLORS.length];
    state.characters.push({ name: `Racer ${state.characters.length + 1}`, color });
    renderCharacterList();
    bindCharacterEvents();
    drawPreview();
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    const err = document.getElementById('start-error');
    if (state.characters.length < 2) {
      err.textContent = 'Add at least 2 racers to start.';
      return;
    }
    err.textContent = '';
    startCountdown();
  });

  bindCharacterEvents();
}

function bindCharacterEvents() {
  document.querySelectorAll('.color-swatch').forEach(el => {
    el.addEventListener('input', e => {
      state.characters[+e.target.dataset.index].color = e.target.value;
      drawPreview();
    });
  });
  document.querySelectorAll('.char-name-input').forEach(el => {
    el.addEventListener('input', e => {
      state.characters[+e.target.dataset.index].name = e.target.value;
    });
  });
  document.querySelectorAll('.btn-remove').forEach(el => {
    el.addEventListener('click', e => {
      const idx = +e.currentTarget.dataset.index;
      state.characters.splice(idx, 1);
      renderCharacterList();
      bindCharacterEvents();
      drawPreview();
    });
  });
}

function drawPreview() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // draw a mini track lane per character (up to 4)
  const shown = state.characters.slice(0, 4);
  const laneH = H / shown.length;

  shown.forEach((c, i) => {
    const laneTop = i * laneH;
    ctx.fillStyle = i % 2 === 0 ? '#1b6321' : '#2c851a';
    ctx.fillRect(0, laneTop, W, laneH - 2);

    // sprite centered in lane
    const spriteW = SPRITE_COLS * PIXEL_SIZE;
    const spriteH = SPRITE_ROWS * PIXEL_SIZE;
    const sx = (W - spriteW) / 2;
    const sy = laneTop + (laneH - spriteH) / 2;
    drawSprite(ctx, i % 2, sx, sy, c.color);
  });
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function startCountdown() {
  state.phase = 'countdown';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="countdown-screen">
      <div id="countdown-display" class="countdown-number">3</div>
    </div>
  `;

  let count = 3;
  const display = document.getElementById('countdown-display');

  const tick = () => {
    display.textContent = count === 0 ? 'GO!' : count;
    display.classList.remove('pop');
    void display.offsetWidth; // reflow to restart animation
    display.classList.add('pop');

    if (count === 0) {
      setTimeout(startRace, 500);
      return;
    }
    count--;
    setTimeout(tick, 900);
  };

  setTimeout(tick, 100);
}

// ─── Race ─────────────────────────────────────────────────────────────────────

const LABEL_W      = 130;
const FINISH_PAD   = 56;
const LANE_H       = 74;
const FRAME_PERIOD = 110; // ms per animation frame

function startRace() {
  state.phase = 'race';

  const app = document.getElementById('app');
  app.innerHTML = `<div class="race-screen"><canvas id="race-canvas"></canvas></div>`;

  const canvas = document.getElementById('race-canvas');
  sizeCanvas(canvas);

  // BASE ≈ 1/60000: at constant speed, runner finishes in ~60s.
  // SPREAD gives each runner a ±20% variance → ~48–72s at base pace.
  const BASE   = 0.000015;
  const SPREAD = 0.000002;

  state.race = {
    canvas,
    ctx: canvas.getContext('2d'),
    runners: state.characters.map((c, i) => ({
      name:         c.name,
      color:        c.color,
      progress:     0,        // 0 → 1
      baseSpeed:    BASE + (Math.random() - 0.5) * SPREAD,
      surgeTimer:   8000 + Math.random() * 7000, // ms until first surge
      surgeDuration:0,
      finished:     false,
      finishRank:   null,
      frameIdx:     i % 2,    // stagger start frames
      frameTimer:   0,
    })),
    finishOrder:  [],
    animHandle:   null,
    lastTime:     null,
  };

  const onResize = () => sizeCanvas(canvas);
  window.addEventListener('resize', onResize);
  state.race._onResize = onResize;

  state.race.animHandle = requestAnimationFrame(raceLoop);
}

function sizeCanvas(canvas) {
  const container = canvas.parentElement;
  canvas.width  = container.clientWidth;
  canvas.height = state.characters.length * LANE_H + 28;
}

function raceLoop(timestamp) {
  const r = state.race;
  if (!r) return;

  if (!r.lastTime) r.lastTime = timestamp;
  const dt = Math.min(timestamp - r.lastTime, 50);
  r.lastTime = timestamp;

  const trackLen = r.canvas.width - LABEL_W - FINISH_PAD;

  // ── Update ──────────────────────────────────────────────────────────────────
  r.runners.forEach(runner => {
    if (runner.finished) return;

    // Surge timer
    runner.surgeTimer -= dt;
    if (runner.surgeTimer <= 0) {
      runner.surgeDuration = 1500 + Math.random() * 2000; // surge lasts 1.5–3.5s
      runner.surgeTimer    = 8000 + Math.random() * 7000; // surge every 8-15 seconds
    }
    if (runner.surgeDuration > 0) runner.surgeDuration -= dt;

    const surgeBoost = runner.surgeDuration > 0 ? 1.5 : 1;

    // Small random jitter keeps movement feeling organic
    const jitter = (Math.random() - 0.5) * 0.000004;
    const speed  = Math.max(0.000005, (runner.baseSpeed + jitter) * surgeBoost);
    runner.progress += speed * dt;

    // Sprite animation
    runner.frameTimer += dt;
    if (runner.frameTimer >= FRAME_PERIOD) {
      runner.frameTimer = 0;
      runner.frameIdx   = runner.frameIdx === 0 ? 1 : 0;
    }

    if (runner.progress >= 1) {
      runner.progress   = 1;
      runner.finished   = true;
      runner.finishRank = r.finishOrder.length + 1;
      r.finishOrder.push(runner);
    }
  });

  // ── Draw ────────────────────────────────────────────────────────────────────
  drawRace(r.ctx, r.canvas, r.runners);

  if (r.finishOrder.length === r.runners.length) {
    cancelAnimationFrame(r.animHandle);
    window.removeEventListener('resize', r._onResize);
    setTimeout(showResults, 1400);
    return;
  }

  r.animHandle = requestAnimationFrame(raceLoop);
}

const RANK_LABELS = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

function drawRace(ctx, canvas, runners) {
  const W        = canvas.width;
  const H        = canvas.height;
  const trackLen = W - LABEL_W - FINISH_PAD;
  const spriteW  = SPRITE_COLS * PIXEL_SIZE;
  const spriteH  = SPRITE_ROWS * PIXEL_SIZE;

  // Background
  ctx.fillStyle = '#ddd26d';
  ctx.fillRect(0, 0, W, H);

  const finishX    = LABEL_W + trackLen;
  const checkerTop = 12;
  const checkerH   = runners.length * LANE_H + 4;
  const tileSize   = 8;

  // ── Pass 1: lane backgrounds + labels ───────────────────────────────────────
  runners.forEach((runner, i) => {
    const laneTop    = 14 + i * LANE_H;
    const laneInnerH = LANE_H - 6;
    const labelY     = laneTop + laneInnerH / 2;

    ctx.fillStyle = i % 2 === 0 ? '#1b6321' : '#2c851a';
    ctx.fillRect(LABEL_W, laneTop, trackLen + FINISH_PAD, laneInnerH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(LABEL_W, laneTop + laneInnerH, trackLen + FINISH_PAD, 2);

    ctx.fillStyle = runner.color;
    ctx.fillRect(8, laneTop + 6, 6, laneInnerH - 12);

    ctx.fillStyle = '#ffffffcc';
    ctx.font = '20px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(runner.name.slice(0, 14), 20, labelY);

    if (runner.finished) {
      const label = RANK_LABELS[runner.finishRank - 1] || `#${runner.finishRank}`;
      ctx.fillStyle = runner.color;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(label, LABEL_W + 6, labelY);
    }
  });

  // ── Finish line (before sprites so runners cross in front of it) ─────────────
  for (let ty = checkerTop; ty < checkerTop + checkerH; ty += tileSize) {
    for (let tx = 0; tx < 2; tx++) {
      const isLight = (Math.floor((ty - checkerTop) / tileSize) + tx) % 2 === 0;
      ctx.fillStyle = isLight ? '#ffffff' : '#000000';
      ctx.fillRect(finishX + tx * tileSize, ty, tileSize, Math.min(tileSize, checkerTop + checkerH - ty));
    }
  }

  ctx.save();
  ctx.translate(finishX + 24, checkerTop + checkerH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#ffffffcc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FINISH', 0, 0);
  ctx.restore();

  // ── Pass 2: runner sprites on top of everything ──────────────────────────────
  runners.forEach((runner, i) => {
    const laneTop    = 14 + i * LANE_H;
    const laneInnerH = LANE_H - 6;
    const rx         = LABEL_W + runner.progress * trackLen - spriteW / 2;
    const ry         = laneTop + (laneInnerH - spriteH) / 2;
    const frame      = runner.finished ? 2 : runner.frameIdx;

    if (runner.surgeDuration > 0 && !runner.finished) {
      drawWindBurst(ctx, rx, ry + spriteH / 2, runner.frameIdx);
    }

    drawSprite(ctx, frame, rx, ry, runner.color);
  });
}

// ─── Results ──────────────────────────────────────────────────────────────────

const MEDAL_EMOJI  = ['🥇','🥈','🥉'];
const PODIUM_ORDER = [1, 0, 2]; // visual: 2nd left, 1st center, 3rd right

function showResults() {
  state.phase = 'results';
  const finishOrder = state.race.finishOrder;

  const top3 = finishOrder.slice(0, 3);
  const rest = finishOrder.slice(3);

  // Render podium in visual order (2nd, 1st, 3rd)
  const podiumHTML = PODIUM_ORDER
    .filter(i => top3[i])
    .map(i => {
      const r = top3[i];
      return `
        <div class="podium-card" style="--accent:${r.color}">
          <div class="podium-medal">${MEDAL_EMOJI[i]}</div>
          <div class="podium-sprite" id="podium-sprite-${i}"></div>
          <div class="podium-name">${r.name}</div>
          <div class="podium-rank">#${i + 1}</div>
        </div>`;
    }).join('');

  const restHTML = rest.length > 0
    ? `<div class="results-rest">
        ${rest.map((r, i) => `
          <div class="result-row">
            <span class="result-rank">#${i + 4}</span>
            <span class="result-dot" style="background:${r.color}"></span>
            <span class="result-name">${r.name}</span>
          </div>`).join('')}
       </div>`
    : '';

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="results-screen">
      <h2 class="results-title">Race Results</h2>
      <div class="podium-row">${podiumHTML}</div>
      ${restHTML}
      <div class="results-actions">
        <button id="btn-race-again" class="btn btn-primary"  type="button">Race Again</button>
        <button id="btn-edit"       class="btn btn-ghost"    type="button">Edit Racers</button>
      </div>
    </div>
  `;

  // Draw pixel sprites on podium cards
  top3.forEach((runner, i) => {
    const container = document.getElementById(`podium-sprite-${i}`);
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.width  = SPRITE_COLS * PIXEL_SIZE;
    canvas.height = SPRITE_ROWS * PIXEL_SIZE;
    canvas.style.imageRendering = 'pixelated';
    container.appendChild(canvas);
    drawSprite(canvas.getContext('2d'), 2, 0, 0, runner.color);
  });

  document.getElementById('btn-race-again').addEventListener('click', startCountdown);
  document.getElementById('btn-edit').addEventListener('click', renderSetup);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

renderSetup();
