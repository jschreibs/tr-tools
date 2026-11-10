// Race The Coco sprites: 16 x 24 pixel characters, front-facing.
//
// Art is written with part codes, then coloured through a per-character
// palette, so every character shares the same run cycle and differs only in
// hair, clothes and colours:
//   h hair        w hair along the crown (the strip a mohawk keeps)
//   b hair beside the face (hair for long cuts, skin for short)
//   c long hair below the ears (empty for short cuts)
//   d long hair at the shoulders
//   x hair texture (strands in a second shade)
//   s skin        e eyes        m mouth
//   v trim (collar, zip, cuffs; same as the top unless a palette says otherwise)
//   t top         u undershirt  a upper sleeve   f forearm   k hand
//   p pants       o shoes

const SPRITE_COLS = 16;
const SPRITE_ROWS = 24;
const OUTLINE     = '#1b1b1b';

const mirrorRow = half => half + [...half].reverse().join('');

// Head and torso, written as left halves and mirrored (arms hang down)
const HEAD = [
  '....hhww',
  '...hhhww',
  '...hhhww',
  '...hhsss',
  '...hbess',
  '...bbsss',
  '..cccssm',
  '..ccccss',
  '..ddddds',
].map(mirrorRow);

// Hair texture: a few strands in a second shade (code x), placed off-centre
// so the two sides don't mirror
[[0, 6], [0, 10], [1, 4], [1, 8], [1, 11], [2, 5], [2, 9], [3, 3], [3, 12]]
  .forEach(([r, c]) => { HEAD[r] = splice(HEAD[r], c, 'x'); });
// ...and on the long side hair (code y; empty on short cuts)
[[6, 3], [7, 12]].forEach(([r, c]) => { HEAD[r] = splice(HEAD[r], c, 'y'); });

const TORSO = [
  '..aattvv',
  '..aatttv',
  '..ffvttv',
  '..vvtttv',
  '..kktttv',
  '....tttv',
  '....pppp',
].map(mirrorRow);

const BLANK = '.'.repeat(SPRITE_COLS);

// Replace columns [from, from + str.length) of a row
function splice(row, from, str) {
  return row.slice(0, from) + str + row.slice(from + str.length);
}

// Run frame: the left arm is pulled up short, the left leg kicks back
const LEGS_RUN = [
  '....pppppppp....',
  '....ppp..ppp....',
  '...ppp...ppp....',
  '..ppp....ppp....',
  '..ooo....ppp....',
  '.........ooo....',
];

const LEGS_STAND = [
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....ooo..ooo....',
];

const flip = rows => rows.map(r => [...r].reverse().join(''));

function frameRun() {
  const torso = [...TORSO];
  // left arm bent up: short sleeve then hand, nothing below
  torso[2] = splice(torso[2], 2, 'kk');
  torso[3] = splice(torso[3], 2, '..');
  torso[4] = splice(torso[4], 2, '..');
  return [BLANK, ...HEAD, ...torso, ...LEGS_RUN, BLANK];
}

function frameWin() {
  const torso = [...TORSO];
  for (const i of [1, 2, 3, 4]) {
    torso[i] = splice(splice(torso[i], 2, '..'), 12, '..');
  }
  const head = [...HEAD];
  // both arms straight up beside the head (rows 3 to 9 of the sprite)
  const armRows = ['kk', 'kk', 'ff', 'ff', 'ff', 'aa', 'aa'];
  armRows.forEach((arm, i) => {
    const r = 2 + i; // index into HEAD (sprite row r + 1)
    if (r < head.length) {
      // upper arm leans in so it meets the shoulder (columns 2-3 / 12-13)
      const left  = i <= 3 ? 1 : 2;
      const right = i <= 3 ? 13 : 12;
      head[r] = splice(splice(head[r], left, arm), right, arm);
    }
  });
  return [BLANK, ...head, ...torso, ...LEGS_STAND, BLANK];
}

const RUN_A = frameRun();
const ART = {
  A: RUN_A,
  B: flip(RUN_A),
  WIN: frameWin(),
};

// ─── Palettes ─────────────────────────────────────────────────────────────────

const SKIN  = '#e8b995';

const PALETTES = {
  // Short blond hair, black tee, gray pants, white shoes
  jerome: {
    h: '#c9a540', w: '#c9a540', x: '#9f7f2c', y: null, b: SKIN, c: null, d: null, s: SKIN, e: OUTLINE, m: '#c98a77',
    t: '#262626', u: '#262626', v: '#262626', a: '#262626', f: SKIN, k: SKIN,
    p: '#7b8088', o: '#f6f6f6',
  },
  // Medium dark-brown hair, orange jacket zipped to the neck with darker
  // orange collar, zip and cuffs, matching orange pants, brown shoes
  coco: {
    h: '#3d2412', w: '#3d2412', x: '#26140a', y: '#26140a', b: '#3d2412', c: '#3d2412', d: null, s: SKIN, e: OUTLINE, m: '#b86f5a',
    t: '#e0701f', u: '#e0701f', v: '#a8480f', a: '#e0701f', f: '#e0701f', k: SKIN,
    p: '#e0701f', o: '#6b3f23',
  },
};

// Any added racer: a single-colour body (head, shirt, pants, hands) in the
// chosen swatch colour, with only the eyes and mouth picked out
function genericPalette(racer) {
  const body = racer.color;
  return {
    h: body, w: body, x: body, y: null, b: body, c: null, d: null,
    s: body, e: OUTLINE, m: OUTLINE,
    t: body, u: body, v: body, a: body, f: body, k: body,
    p: body, o: body,
  };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const gridCache = new Map();

function darken(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Returns a 24 x 16 grid of colours (null = transparent), outlined
function spriteGrid(racer, frameName) {
  const key = `${racer.sprite}|${racer.color}|${frameName}`;
  if (gridCache.has(key)) return gridCache.get(key);

  const palette = PALETTES[racer.sprite] || genericPalette(racer);
  const art = ART[frameName];
  const grid = art.map(row =>
    [...row.padEnd(SPRITE_COLS, '.')].map(code => (code === '.' ? null : palette[code] ?? null))
  );

  // Shade: the right-hand edge of every part is a touch darker, so the
  // figures read as rounded instead of flat
  for (let y = 0; y < SPRITE_ROWS; y++) {
    for (let x = 0; x < SPRITE_COLS; x++) {
      if (grid[y][x] && grid[y][x] !== OUTLINE && !grid[y][x + 1]) {
        grid[y][x] = darken(grid[y][x], 0.74);
      }
    }
  }

  // 1px outline on the outside of the figure
  const out = grid.map(row => [...row]);
  for (let y = 0; y < SPRITE_ROWS; y++) {
    for (let x = 0; x < SPRITE_COLS; x++) {
      if (grid[y][x]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx]);
      if (near) out[y][x] = OUTLINE;
    }
  }

  gridCache.set(key, out);
  return out;
}

const FRAME_NAMES = ['A', 'B', 'WIN'];

function drawSprite(ctx, frameIdx, x, y, racer, pixel) {
  const grid = spriteGrid(racer, FRAME_NAMES[frameIdx]);
  for (let row = 0; row < SPRITE_ROWS; row++) {
    for (let col = 0; col < SPRITE_COLS; col++) {
      const color = grid[row][col];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x) + col * pixel, Math.round(y) + row * pixel, pixel, pixel);
    }
  }
}
