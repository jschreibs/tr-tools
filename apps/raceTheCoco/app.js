// Race The Coco: app.js
// Sprites live in sprites.js (16 x 24 pixel characters).

const PIXEL_SIZE = 4; // screen pixels per sprite pixel in the race
const SPRITE_W   = SPRITE_COLS * PIXEL_SIZE;
const SPRITE_H   = SPRITE_ROWS * PIXEL_SIZE;

// Planner palette
const PAPER   = '#fafaf5';
const PAPER_2 = '#eee9da';
const GREEN   = '#1d4b34';
const ORANGE  = '#d64000';
const INK     = '#14281e';
const DISPLAY = '"Archivo Black", system-ui, sans-serif';

// ─── Wind Burst (drawn behind a runner during a surge) ────────────────────────
// Horizontal speed lines that shoot leftward from the runner's back.
// Two alternating frames shift the line lengths to create a whoosh animation.
const WIND_LINES = [
  // [dy from center, length in frame 0, length in frame 1]
  [-30,  8, 12],
  [-12, 18, 22],
  [  5, 24, 28],
  [ 22, 16, 20],
  [ 38,  8, 12],
];
const WIND_COLORS_NORMAL = ['#1d4b3433', '#1d4b3466', '#1d4b3499', '#1d4b3466', '#1d4b3433'];
const WIND_COLORS_SUPER  = ['#d6400033', '#d6400066', '#d64000cc', '#d6400066', '#d6400033'];

function drawWindBurst(ctx, x, y, frameIdx, isSuper, minX) {
  const f = frameIdx % 2;
  const colors = isSuper ? WIND_COLORS_SUPER : WIND_COLORS_NORMAL;
  WIND_LINES.forEach(([dy, len0, len1], i) => {
    const len   = (f === 0 ? len0 : len1) * (isSuper ? 1.6 : 1);
    const start = Math.max(Math.round(x) - len, minX);
    ctx.fillStyle = colors[i];
    ctx.fillRect(start, Math.round(y) + dy, Math.round(x) - start, 3);
  });
}

// ─── State ────────────────────────────────────────────────────────────────────

// Each racer: its own sprite (a look), a lane accent colour, and a name.
// Looks belong to the racer, never to the typed name.
const DEFAULT_CHARACTERS = [
  { name: 'Jerome',   sprite: 'jerome', color: '#262626' },
  { name: 'The Coco', sprite: 'coco',   color: '#e0701f' },
];

const EXTRA_COLORS = ['#2f6f9f', '#20ce94', '#8820ce', '#e91e63', '#00a3b4', '#ff5722', '#886457', '#46565e', '#b8860b', '#5b8c2a'];
const MAX_RACERS   = 12;

const state = {
  characters: DEFAULT_CHARACTERS.map(c => ({ ...c })),
  phase: 'setup',
  race: null,
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_REMOVE =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
  'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const ICON_PLAY =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';

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
      <section class="setup-panel" aria-labelledby="racers-title">
        <div class="panel-header">
          <h2 id="racers-title">Racers</h2>
          <button id="btn-add" class="btn btn-secondary" type="button">+ Add racer</button>
        </div>
        <div id="character-list" class="character-list"></div>
      </section>

      <aside class="setup-sidebar">
        <div class="race-preview" aria-hidden="true">
          <canvas id="preview-canvas" width="260" height="190"></canvas>
        </div>
        <button id="btn-start" class="btn btn-primary btn-large" type="button">
          Start race ${ICON_PLAY}
        </button>
        <p id="start-error" class="start-error" role="alert"></p>
      </aside>
    </div>
  `;

  renderCharacterList();
  bindSetupEvents();
  drawPreview();
  updateAddButton();
}

function renderCharacterList() {
  const list = document.getElementById('character-list');
  if (!list) return;

  list.innerHTML = state.characters.map((c, i) => `
    <div class="character-row" data-index="${i}">
      <canvas class="char-thumb" width="${SPRITE_COLS * 2}" height="${SPRITE_ROWS * 2}" data-index="${i}" aria-hidden="true"></canvas>
      <label class="visually-hidden" for="name-${i}">Racer ${i + 1} name</label>
      <input id="name-${i}" type="text" class="char-name-input" value="${escapeAttr(c.name)}" data-index="${i}" maxlength="20" placeholder="Name">
      ${c.sprite === 'generic'
        ? `<input type="color" class="color-swatch" value="${c.color}" data-index="${i}" aria-label="Colour for ${escapeAttr(c.name)}">`
        : ''}
      <button class="btn-remove" data-index="${i}" type="button" aria-label="Remove ${escapeAttr(c.name || 'racer')}">${ICON_REMOVE}</button>
    </div>
  `).join('');

  list.querySelectorAll('.char-thumb').forEach(canvas => {
    const racer = state.characters[+canvas.dataset.index];
    drawSprite(canvas.getContext('2d'), 0, 0, 0, racer, 2);
  });
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Smallest "Racer N" not already used, and the first colour not already used
function nextRacerName() {
  const used = new Set(state.characters.map(c => c.name));
  let n = 1;
  while (used.has(`Racer ${n}`)) n++;
  return `Racer ${n}`;
}

function nextRacerColor() {
  const used = new Set(state.characters.map(c => c.color));
  return EXTRA_COLORS.find(c => !used.has(c)) || EXTRA_COLORS[state.characters.length % EXTRA_COLORS.length];
}

function updateAddButton() {
  const btn  = document.getElementById('btn-add');
  const full = state.characters.length >= MAX_RACERS;
  btn.disabled = full;
  btn.title    = full ? `Up to ${MAX_RACERS} racers` : '';
}

function bindSetupEvents() {
  document.getElementById('btn-add').addEventListener('click', () => {
    if (state.characters.length >= MAX_RACERS) return;
    state.characters.push({ name: nextRacerName(), sprite: 'generic', color: nextRacerColor() });
    renderCharacterList();
    bindCharacterEvents();
    drawPreview();
    updateAddButton();
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

// Refresh one racer's thumbnail and the track preview after a look change
function redrawRacer(i) {
  const thumb = document.querySelector(`.char-thumb[data-index="${i}"]`);
  if (thumb) {
    const ctx = thumb.getContext('2d');
    ctx.clearRect(0, 0, thumb.width, thumb.height);
    drawSprite(ctx, 0, 0, 0, state.characters[i], 2);
  }
  drawPreview();
}

function bindCharacterEvents() {
  document.querySelectorAll('.color-swatch').forEach(el => {
    el.addEventListener('input', e => {
      const i = +e.target.dataset.index;
      state.characters[i].color = e.target.value;
      redrawRacer(i);
    });
  });
  document.querySelectorAll('.char-name-input').forEach(el => {
    el.addEventListener('input', e => {
      state.characters[+e.target.dataset.index].name = e.target.value;
    });
    el.addEventListener('blur', e => {
      const i = +e.target.dataset.index;
      const name = e.target.value.trim() || `Racer ${i + 1}`;
      state.characters[i].name = name;
      e.target.value = name;
    });
  });
  document.querySelectorAll('.btn-remove').forEach(el => {
    el.addEventListener('click', e => {
      const idx = +e.currentTarget.dataset.index;
      state.characters.splice(idx, 1);
      renderCharacterList();
      bindCharacterEvents();
      drawPreview();
      updateAddButton();
    });
  });
}

const PREVIEW_LANE_H = 84;
const PREVIEW_LABEL_W = 124;

function drawPreview() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;

  // One lane per racer. Sized to the displayed width at an integer pixel
  // ratio so sprite pixels stay crisp.
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const W   = Math.floor(canvas.parentElement.clientWidth) || 354;
  const H   = Math.max(1, state.characters.length) * PREVIEW_LANE_H;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const shown = state.characters;
  if (shown.length === 0) return;
  const laneH = PREVIEW_LANE_H;
  const px    = 3;

  shown.forEach((c, i) => {
    const top = i * laneH;
    ctx.fillStyle = i % 2 === 0 ? PAPER : PAPER_2;
    ctx.fillRect(0, top, W, laneH);
    ctx.fillStyle = GREEN;
    ctx.fillRect(0, top + laneH - 3, W, 3);

    // name label
    ctx.fillStyle = INK;
    ctx.font = `14px ${DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fitText(ctx, c.name || `Racer ${i + 1}`, PREVIEW_LABEL_W - 18), 10, top + (laneH - 3) / 2);

    // start rule
    ctx.fillStyle = GREEN;
    ctx.fillRect(PREVIEW_LABEL_W - 3, top, 3, laneH - 3);

    // finish tape
    for (let ty = 0; ty < laneH - 3; ty += 6) {
      for (let tx = 0; tx < 2; tx++) {
        ctx.fillStyle = ((ty / 6) + tx) % 2 === 0 ? '#ffffff' : INK;
        ctx.fillRect(W - 18 + tx * 6, top + ty, 6, Math.min(6, laneH - 3 - ty));
      }
    }
    ctx.fillStyle = GREEN;

    const sy = top + (laneH - 3 - SPRITE_ROWS * px) / 2;
    drawSprite(ctx, i % 2, PREVIEW_LABEL_W + 10, sy, c, px);
  });
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function startCountdown() {
  state.phase = 'countdown';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="countdown-screen" aria-live="assertive">
      <div id="countdown-display" class="countdown-number">3</div>
      <div id="countdown-racers" class="countdown-racers" aria-hidden="true"></div>
    </div>
  `;

  const row = document.getElementById('countdown-racers');
  state.characters.forEach(c => {
    const canvas = document.createElement('canvas');
    canvas.width  = SPRITE_W;
    canvas.height = SPRITE_H;
    row.appendChild(canvas);
    drawSprite(canvas.getContext('2d'), 0, 0, 0, c, PIXEL_SIZE);
  });

  let count = 3;
  const display = document.getElementById('countdown-display');

  const tick = () => {
    display.textContent = count === 0 ? 'GO!' : count;
    display.classList.toggle('go', count === 0);
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

const LABEL_W      = 170;
const FINISH_PAD   = 56;
const LANE_H       = 116;
const TOP_PAD      = 6;
const FRAME_PERIOD = 110; // ms per animation frame

function startRace() {
  state.phase = 'race';

  const app = document.getElementById('app');
  app.innerHTML = `<div class="race-screen"><canvas id="race-canvas" aria-label="Race in progress"></canvas></div>`;

  const canvas = document.getElementById('race-canvas');
  sizeCanvas(canvas);

  // BASE ≈ 3/100000 per ms → about 33s to cross at base pace.
  // SPREAD gives each runner a ±5% variance on top of that.
  // Every racer uses the same pace: the race is decided by chance alone.
  const BASE   = 0.00003;
  const SPREAD = 0.000003;

  state.race = {
    canvas,
    ctx: canvas.getContext('2d'),
    runners: state.characters.map((c, i) => ({
      name:         c.name.trim() || `Racer ${i + 1}`,
      sprite:       c.sprite,
      color:        c.color,
      progress:     0,        // 0 → 1
      baseSpeed:    BASE + (Math.random() - 0.5) * SPREAD,
      surgeTimer:        500, // ms until first surge
      surgeDuration:     0,
      superSurgeDuration:0,
      finished:          false,
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
  const dpr  = Math.max(1, Math.floor(window.devicePixelRatio || 1)); // integer: no seams between pixels
  const cssW = container.clientWidth;
  const cssH = state.characters.length * LANE_H + TOP_PAD;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = `${cssH}px`;
  canvas._dpr  = dpr;
  canvas._cssW = cssW;
  canvas._cssH = cssH;
}

function raceLoop(timestamp) {
  const r = state.race;
  if (!r) return;

  if (!r.lastTime) r.lastTime = timestamp;
  const dt = Math.min(timestamp - r.lastTime, 50);
  r.lastTime = timestamp;

  // ── Update ──────────────────────────────────────────────────────────────────

  // Compute current race positions (1st = highest progress) for catchup mechanic
  const SUPER_SURGE_CHANCE = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.12, 0.15];
  const activeRunners = r.runners.filter(rn => !rn.finished);
  const sorted = [...activeRunners].sort((a, b) => b.progress - a.progress);
  sorted.forEach((rn, i) => { rn._currentRank = i + 1; });

  r.runners.forEach(runner => {
    if (runner.finished) return;

    // Normal surge timer
    runner.surgeTimer -= dt;
    if (runner.surgeTimer <= 0) {
      runner.surgeDuration = 1000 + Math.random() * 3000; // surge lasts 1–3s
      runner.surgeTimer    = 5000 + Math.random() * 10000; // surge every 5-15 seconds
    }
    if (runner.surgeDuration > 0) runner.surgeDuration -= dt;

    // Super surge: rolls each frame with position-based probability
    if (runner.superSurgeDuration > 0) {
      runner.superSurgeDuration -= dt;
    } else {
      const rank   = runner._currentRank || 1;
      const chance = (SUPER_SURGE_CHANCE[rank] || 0) * (dt / 1000);
      if (Math.random() < chance) {
        runner.superSurgeDuration = 800 + Math.random() * 1200; // 0.8–2s burst
      }
    }

    const superActive = runner.superSurgeDuration > 0;
    let surgeBoost = 1;
    if (superActive) surgeBoost = 3;
    else if (runner.surgeDuration > 0) surgeBoost = 1.5;

    // Small random jitter keeps movement feeling organic
    const jitter = (Math.random() - 0.5) * 0.00005;
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
  followLeader(r);

  if (r.finishOrder.length === r.runners.length) {
    cancelAnimationFrame(r.animHandle);
    window.removeEventListener('resize', r._onResize);
    setTimeout(showResults, 1400);
    return;
  }

  r.animHandle = requestAnimationFrame(raceLoop);
}

// With many racers the track is taller than the window: scroll so the
// frontrunner's lane stays on screen
function followLeader(r) {
  if (r.canvas._cssH <= window.innerHeight) return;
  const live = r.runners.filter(rn => !rn.finished);
  if (live.length === 0) return;
  const leader = live.reduce((a, b) => (b.progress > a.progress ? b : a));
  const lane   = r.runners.indexOf(leader);
  const rect   = r.canvas.getBoundingClientRect();
  const laneTop    = rect.top + TOP_PAD + lane * LANE_H;
  const laneBottom = laneTop + LANE_H;
  if (laneTop < 8 || laneBottom > window.innerHeight - 8) {
    window.scrollBy({ top: laneTop - window.innerHeight * 0.35, behavior: 'auto' });
  }
}

const RANK_LABELS = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

// Fit text to a width, ending in an ellipsis when it has to be cut
function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function drawRace(ctx, canvas, runners) {
  const dpr = canvas._dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W        = canvas._cssW || canvas.width;
  const H        = canvas._cssH || canvas.height;
  // Narrow screens get a slimmer label column so the track keeps its length
  const narrow   = W < 600;
  const LW       = narrow ? 112 : LABEL_W;
  const trackLen = Math.max(120, W - LW - FINISH_PAD);

  // Paper ground
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const finishX  = LW + trackLen;
  const tileSize = 8;

  // ── Pass 1: ruled lanes and labels ─────────────────────────────────────────
  runners.forEach((runner, i) => {
    const laneTop = TOP_PAD + i * LANE_H;
    const labelY  = laneTop + LANE_H / 2;

    ctx.fillStyle = i % 2 === 0 ? PAPER : PAPER_2;
    ctx.fillRect(0, laneTop, W, LANE_H);

    // lane rule
    ctx.fillStyle = GREEN;
    ctx.fillRect(0, laneTop + LANE_H - 3, W, 3);

    // colour chip + name
    ctx.fillStyle = runner.color;
    ctx.fillRect(narrow ? 8 : 14, labelY - 10, narrow ? 10 : 12, 20);
    ctx.fillStyle = INK;
    ctx.font = `${narrow ? 14 : 18}px ${DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textX = narrow ? 24 : 36;
    ctx.fillText(fitText(ctx, runner.name, LW - 3 - textX - 6), textX, labelY);

    // start rule
    ctx.fillStyle = GREEN;
    ctx.fillRect(LW - 3, laneTop, 3, LANE_H - 3);

    if (runner.finished) {
      const label = RANK_LABELS[runner.finishRank - 1] || `#${runner.finishRank}`;
      ctx.fillStyle = ORANGE;
      ctx.font = `20px ${DISPLAY}`;
      ctx.fillText(label, LW + 14, labelY);
    }
  });

  // Top rule
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, TOP_PAD);

  // ── Finish line (before sprites so runners cross in front of it) ───────────
  const checkerTop = TOP_PAD;
  const checkerH   = runners.length * LANE_H - 3;
  for (let ty = checkerTop; ty < checkerTop + checkerH; ty += tileSize) {
    for (let tx = 0; tx < 2; tx++) {
      const isLight = (Math.floor((ty - checkerTop) / tileSize) + tx) % 2 === 0;
      ctx.fillStyle = isLight ? '#ffffff' : INK;
      ctx.fillRect(finishX + tx * tileSize, ty, tileSize, Math.min(tileSize, checkerTop + checkerH - ty));
    }
  }

  ctx.save();
  ctx.translate(finishX + 36, checkerTop + checkerH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = GREEN;
  ctx.font = `18px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FINISH', 0, 0);
  ctx.restore();

  // ── Pass 2: runner sprites on top of everything ────────────────────────────
  runners.forEach((runner, i) => {
    const laneTop = TOP_PAD + i * LANE_H;
    const rx      = LW + runner.progress * trackLen - SPRITE_W / 2;
    const ry      = laneTop + (LANE_H - 3 - SPRITE_H) / 2;
    const frame   = runner.finished ? 2 : runner.frameIdx;

    const anySurge = (runner.surgeDuration > 0 || runner.superSurgeDuration > 0) && !runner.finished;
    if (anySurge) {
      drawWindBurst(ctx, rx, ry + SPRITE_H / 2, runner.frameIdx, runner.superSurgeDuration > 0, LW);
    }

    drawSprite(ctx, frame, rx, ry, runner, PIXEL_SIZE);
  });
}

// ─── Results ──────────────────────────────────────────────────────────────────

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
        <div class="podium-card rank-${i + 1}">
          <div class="podium-sprite" id="podium-sprite-${i}"></div>
          <div class="podium-name">${escapeHTML(r.name)}</div>
          <div class="podium-step"><span>${i + 1}</span></div>
        </div>`;
    }).join('');

  const restHTML = rest.length > 0
    ? `<ol class="results-rest" start="4">
        ${rest.map((r, i) => `
          <li class="result-row">
            <span class="result-rank">${i + 4}</span>
            <canvas class="result-thumb" width="${SPRITE_COLS * 2}" height="${SPRITE_ROWS * 2}" data-rest="${i}" aria-hidden="true"></canvas>
            <span class="result-name">${escapeHTML(r.name)}</span>
          </li>`).join('')}
       </ol>`
    : '';

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="results-screen">
      <h2 class="results-title">Race results</h2>
      <div class="podium-row">${podiumHTML}</div>
      ${restHTML}
      <div class="results-actions">
        <button id="btn-race-again" class="btn btn-primary"   type="button">Race again</button>
        <button id="btn-edit"       class="btn btn-secondary" type="button">Edit racers</button>
      </div>
    </div>
  `;

  // Draw each podium finisher's winning pose
  top3.forEach((runner, i) => {
    const container = document.getElementById(`podium-sprite-${i}`);
    if (!container) return;
    const px = 6;
    const canvas = document.createElement('canvas');
    canvas.width  = SPRITE_COLS * px;
    canvas.height = SPRITE_ROWS * px;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    drawSprite(canvas.getContext('2d'), 2, 0, 0, runner, px);
  });

  document.querySelectorAll('.result-thumb').forEach(canvas => {
    const runner = rest[+canvas.dataset.rest];
    drawSprite(canvas.getContext('2d'), 0, 0, 0, runner, 2);
  });

  document.getElementById('btn-race-again').addEventListener('click', startCountdown);
  document.getElementById('btn-edit').addEventListener('click', renderSetup);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

// Warm the display face so canvas text uses it from the first frame
if (document.fonts && document.fonts.load) {
  document.fonts.load(`18px ${DISPLAY}`).then(() => {
    if (state.phase === 'setup') drawPreview(); // redraw labels in the display face
  });
}

renderSetup();
