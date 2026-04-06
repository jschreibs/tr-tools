import { STATUS, STATUS_META, REQUIREMENTS, STORAGE_KEYS } from './constants.js';

// ─── State ────────────────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);

const state = {
  year:             today.getFullYear(),
  month:            today.getMonth(),
  requirement:      loadRequirement(),
  days:             loadDays(),
  activePopoverKey: null,
};

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadDays() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAYS)) ?? {}; }
  catch { return {}; }
}

function loadRequirement() {
  const v = parseInt(localStorage.getItem(STORAGE_KEYS.REQUIREMENT), 10);
  return REQUIREMENTS.includes(v) ? v : REQUIREMENTS[0];
}

function saveDays()        { localStorage.setItem(STORAGE_KEYS.DAYS,        JSON.stringify(state.days)); }
function saveRequirement() { localStorage.setItem(STORAGE_KEYS.REQUIREMENT, String(state.requirement)); }

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns weeks (arrays of 5 Date objects, Mon–Fri) covering the given month.
 * Leading/trailing days from adjacent months are included to fill partial weeks.
 */
function getCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Rewind to the Monday on or before the 1st
  const cur = new Date(firstDay);
  const dow = firstDay.getDay(); // 0 = Sun
  cur.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks = [];
  while (cur <= lastDay) {
    const week = [];
    for (let i = 0; i < 5; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    cur.setDate(cur.getDate() + 2); // skip Sat + Sun
    weeks.push(week);
  }
  return weeks;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeStats() {
  const { year, month, requirement } = state;
  const weeks = getCalendarWeeks(year, month);

  let totalInOffice = 0, totalRemote = 0, totalOOO = 0;
  let weeksTracked = 0, inOfficeInTrackedWeeks = 0;

  for (const week of weeks) {
    let wInOffice = 0, wWorking = 0;

    for (const date of week) {
      if (date.getMonth() !== month) continue;
      const s = state.days[toKey(date)];
      if      (s === STATUS.IN_OFFICE) { totalInOffice++; wInOffice++; wWorking++; }
      else if (s === STATUS.REMOTE)    { totalRemote++;                wWorking++; }
      else if (s === STATUS.OOO)       { totalOOO++; }
    }

    if (wWorking > 0) {
      weeksTracked++;
      inOfficeInTrackedWeeks += wInOffice;
    }
  }

  const avg = weeksTracked > 0 ? inOfficeInTrackedWeeks / weeksTracked : null;

  return {
    inOffice: totalInOffice,
    remote:   totalRemote,
    ooo:      totalOOO,
    avg,
    onTrack:  avg !== null && avg >= requirement,
  };
}

// ─── Render ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March',     'April',   'May',      'June',
  'July',    'August',   'September', 'October', 'November', 'December',
];

function render() {
  document.getElementById('month-label').textContent =
    `${MONTH_NAMES[state.month]} ${state.year}`;
  renderSidebar();
  renderCalendarCells();
}

function renderSidebar() {
  const stats = computeStats();

  // Requirement buttons
  document.querySelectorAll('.req-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.req) === state.requirement);
  });

  document.getElementById('stat-target').textContent    = `${state.requirement} days / week`;
  document.getElementById('stat-in-office').textContent = stats.inOffice;
  document.getElementById('stat-remote').textContent    = stats.remote;
  document.getElementById('stat-ooo').textContent       = stats.ooo;
  document.getElementById('stat-avg').textContent       = stats.avg !== null ? stats.avg.toFixed(1) : '—';

  const badge = document.getElementById('stat-status-badge');
  if (stats.avg === null) {
    badge.textContent = 'No data';
    badge.className   = 'badge badge-neutral';
  } else if (stats.onTrack) {
    badge.textContent = 'On track';
    badge.className   = 'badge badge-success';
  } else {
    badge.textContent = 'Behind';
    badge.className   = 'badge badge-warning';
  }
}

function renderCalendarCells() {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  for (const week of getCalendarWeeks(state.year, state.month)) {
    for (const date of week) {
      const key            = toKey(date);
      const status         = state.days[key] ?? STATUS.NONE;
      const inCurrentMonth = date.getMonth() === state.month;
      const isToday        = date.getTime() === today.getTime();

      const cell = document.createElement('button');
      cell.type      = 'button';
      cell.className = 'day-cell';
      if (status !== STATUS.NONE) cell.dataset.status = status;
      if (isToday)                cell.classList.add('today');
      if (!inCurrentMonth)        cell.classList.add('out-of-month');

      const numEl = document.createElement('span');
      numEl.className   = 'day-num';
      numEl.textContent = date.getDate();
      cell.appendChild(numEl);

      if (status !== STATUS.NONE) {
        const labelEl = document.createElement('span');
        labelEl.className   = 'day-status-label';
        labelEl.textContent = STATUS_META[status].label;
        cell.appendChild(labelEl);
      }

      if (inCurrentMonth) {
        cell.addEventListener('click', e => onDayClick(e, key, cell));
      } else {
        cell.disabled = true;
      }

      grid.appendChild(cell);
    }
  }
}

// ─── Popover ──────────────────────────────────────────────────────────────────

function onDayClick(e, key, cellEl) {
  e.stopPropagation();
  if (state.activePopoverKey === key) { closePopover(); return; }
  closePopover();
  openPopover(key, cellEl);
}

function openPopover(key, anchorEl) {
  state.activePopoverKey = key;

  const pop = document.createElement('div');
  pop.id        = 'day-popover';
  pop.className = 'day-popover';
  pop.addEventListener('click', e => e.stopPropagation());

  const current = state.days[key] ?? STATUS.NONE;

  for (const s of [STATUS.IN_OFFICE, STATUS.REMOTE, STATUS.OOO, STATUS.NONE]) {
    const meta = STATUS_META[s];
    const btn  = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'popover-option';
    if (s === current) btn.classList.add('selected');

    if (s !== STATUS.NONE) {
      const dot = document.createElement('span');
      dot.className        = 'popover-dot';
      dot.style.background = meta.bg;
      dot.style.outline    = `1.5px solid ${meta.fg}40`;
      btn.appendChild(dot);
    }

    const label = document.createElement('span');
    label.textContent = meta.label;
    btn.appendChild(label);

    if (s === STATUS.NONE && current !== STATUS.NONE) {
      btn.classList.add('popover-clear');
    }

    btn.addEventListener('click', () => onStatusSelect(key, s));
    pop.appendChild(btn);
  }

  document.body.appendChild(pop);
  positionPopover(pop, anchorEl);
}

function positionPopover(pop, anchor) {
  const ar = anchor.getBoundingClientRect();
  let top  = ar.bottom + 6;
  let left = ar.left;

  // Flip above if clipped at bottom
  if (top + 170 > window.innerHeight - 8) top = ar.top - 170 - 6;
  // Clamp horizontally
  if (left + 160 > window.innerWidth - 8) left = window.innerWidth - 168;
  if (left < 8) left = 8;

  pop.style.top  = `${top}px`;
  pop.style.left = `${left}px`;
}

function closePopover() {
  document.getElementById('day-popover')?.remove();
  state.activePopoverKey = null;
}

function onStatusSelect(key, status) {
  if (status === STATUS.NONE) delete state.days[key];
  else                        state.days[key] = status;

  saveDays();
  closePopover();
  renderCalendarCells();
  renderSidebar();
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function prevMonth() {
  if (state.month === 0) { state.year--;  state.month = 11; }
  else                   { state.month--; }
  render();
}

function nextMonth() {
  if (state.month === 11) { state.year++;  state.month = 0; }
  else                    { state.month++; }
  render();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.getElementById('btn-prev').addEventListener('click', prevMonth);
document.getElementById('btn-next').addEventListener('click', nextMonth);

document.querySelectorAll('.req-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.requirement = Number(btn.dataset.req);
    saveRequirement();
    renderSidebar();
  });
});

document.addEventListener('click', closePopover);

render();
