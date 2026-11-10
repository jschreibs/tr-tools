// Folder drawer: choosing a tab pulls that folder's panel forward.

const tabList = document.getElementById('tabs');
const folder  = document.getElementById('folder');
const tabs    = [...tabList.querySelectorAll('.tab')];

// Race The Coco preview: Jerome and The Coco on the app's paper track,
// drawn with the app's own sprites
const RACE_PREVIEW = [
  { sprite: 'jerome', color: '#262626', name: 'Jerome',   at: 0.58, frame: 0 },
  { sprite: 'coco',   color: '#e0701f', name: 'The Coco', at: 0.34, frame: 1 },
];

function drawRacePreview() {
  const canvas = document.getElementById('race-preview');
  if (!canvas || !canvas.parentElement.clientWidth) return; // hidden panel

  const GREEN = '#1d4b34', PAPER = '#fafaf5', PAPER_2 = '#eee9da', INK = '#14281e';
  const px = 4, laneH = 118, labelW = 140;
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const W = Math.floor(canvas.parentElement.clientWidth);
  const H = RACE_PREVIEW.length * laneH;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const trackW = W - labelW - 40;

  RACE_PREVIEW.forEach((r, i) => {
    const top = i * laneH;
    ctx.fillStyle = i % 2 === 0 ? PAPER : PAPER_2;
    ctx.fillRect(0, top, W, laneH);
    ctx.fillStyle = GREEN;
    // rule between lanes only; the last lane sits on the card's own border
    const last = i === RACE_PREVIEW.length - 1;
    if (!last) ctx.fillRect(0, top + laneH - 3, W, 3);
    ctx.fillRect(labelW - 3, top, 3, last ? laneH : laneH - 3);

    // colour chip + name
    ctx.fillStyle = r.color;
    ctx.fillRect(14, top + laneH / 2 - 9, 10, 18);
    ctx.fillStyle = INK;
    ctx.font = '16px "Archivo Black", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.name, 32, top + (laneH - 3) / 2);

    const sx = labelW + r.at * trackW - (SPRITE_COLS * px) / 2;
    const sy = top + (laneH - 3 - SPRITE_ROWS * px) / 2;
    drawSprite(ctx, r.frame, sx, sy, r, px);
  });

  // checkered finish
  const finishX = W - 28;
  for (let ty = 0; ty < H; ty += 8) {
    for (let tx = 0; tx < 2; tx++) {
      ctx.fillStyle = ((ty / 8) + tx) % 2 === 0 ? '#ffffff' : INK;
      ctx.fillRect(finishX + tx * 8, ty, 8, Math.min(8, H - ty));
    }
  }
}

function select(index, { focus = false, animate = true } = {}) {
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    if (active && focus) tab.focus();
  });

  folder.classList.remove('is-sliding');
  if (animate) {
    void folder.offsetWidth; // restart the animation
    folder.classList.add('is-sliding');
  }

  history.replaceState(null, '', `#${tabs[index].id.replace('tab-', '')}`);
  drawRacePreview();
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => select(i));
  tab.addEventListener('keydown', e => {
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft')  next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home')       next = 0;
    if (e.key === 'End')        next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next, { focus: true });
  });
});

// Deep link: index.html#race-the-coco opens that folder
const wanted = tabs.findIndex(t => `#${t.id.replace('tab-', '')}` === location.hash);
if (wanted > 0) select(wanted, { animate: false });

// The preview needs the display face and the real width
if (document.fonts && document.fonts.load) {
  document.fonts.load('16px "Archivo Black"').then(drawRacePreview);
}
window.addEventListener('resize', drawRacePreview);
drawRacePreview();
