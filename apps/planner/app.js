import {
  STATUS, STATUS_META, OOO_TYPES, WEEKLY_TYPES, HOURS_PER_DAY, BALANCES,
  REQUIREMENTS, STORAGE_KEYS,
} from './constants.js';
import { HOLIDAYS } from './holidays.js';

// Flat map of date key → holiday name, built from all years in HOLIDAYS
const HOLIDAY_NAMES = Object.values(HOLIDAYS)
  .flat()
  .reduce((acc, { date, name }) => { acc[date] = name; return acc; }, {});

// ─── State ────────────────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);

const state = {
  year:             today.getFullYear(),
  month:            today.getMonth(),
  requirement:      loadRequirement(),
  days:             loadDays(),
  notes:            loadJSON(STORAGE_KEYS.NOTES),
  plan:             loadJSON(STORAGE_KEYS.PLAN),
  adjust:           loadJSON(STORAGE_KEYS.ADJUST),
  editBalances:     false,
  activePopoverKey: null,
  paintStatus:      null,  // STATUS.* or 'ooo' (group) when paint mode is on
  oooType:          STATUS.VACATION, // which OOO type the OOO tool paints
  isPainting:       false,
  strokeStart:      null,  // copy of state.days when the current paint stroke began
  undoStack:        [],    // paint strokes: { before, after } maps of changed day keys
  redoStack:        [],
};

const isWeekly = s => WEEKLY_TYPES.includes(s);
const isOOO    = s => OOO_TYPES.includes(s);
// The status the active paint tool actually writes
const paintTarget = () => state.paintStatus === 'ooo' ? state.oooType : state.paintStatus;

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadJSON(storageKey) {
  try { return JSON.parse(localStorage.getItem(storageKey)) ?? {}; }
  catch { return {}; }
}

function loadDays() {
  const days = loadJSON(STORAGE_KEYS.DAYS);
  // Legacy generic "ooo" days become Vacation
  let migrated = false;
  for (const [key, s] of Object.entries(days)) {
    if (s === 'ooo') { days[key] = STATUS.VACATION; migrated = true; }
  }
  if (migrated) localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
  return days;
}

function loadRequirement() {
  const v = parseInt(localStorage.getItem(STORAGE_KEYS.REQUIREMENT), 10);
  return REQUIREMENTS.includes(v) ? v : REQUIREMENTS[0];
}

function saveDays()        { localStorage.setItem(STORAGE_KEYS.DAYS,        JSON.stringify(state.days)); }
function saveRequirement() { localStorage.setItem(STORAGE_KEYS.REQUIREMENT, String(state.requirement)); }
function saveNotes()       { localStorage.setItem(STORAGE_KEYS.NOTES,       JSON.stringify(state.notes)); }
function saveAdjust()      { localStorage.setItem(STORAGE_KEYS.ADJUST,      JSON.stringify(state.adjust)); }
function savePlan()        { localStorage.setItem(STORAGE_KEYS.PLAN,        JSON.stringify(state.plan)); }

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns exactly 5 weeks (arrays of 5 Date objects, Mon–Fri) for the given month.
 * Leading/trailing days from adjacent months are included to fill partial weeks.
 */
function getCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Start on the Monday of the first weekday's week. If the 1st is a Sat/Sun, the
  // month's first weekday is the next Monday, so don't show the (empty) prior week.
  const cur = new Date(firstDay);
  const dow = firstDay.getDay(); // 0 = Sun
  if      (dow === 6) cur.setDate(firstDay.getDate() + 2);
  else if (dow === 0) cur.setDate(firstDay.getDate() + 1);
  else                cur.setDate(firstDay.getDate() - (dow - 1));

  // Always 5 rows. A month never needs 6 (Mon–Fri weeks), but a 28-day February that
  // starts on a Monday only fills 4, so pad with the following week (shown greyed).
  const weeks = [];
  while (cur <= lastDay || weeks.length < 5) {
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

/** Mon–Fri keys of the week containing the given 'YYYY-MM-DD' key. */
function weekKeys(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow  = date.getDay(); // 0 = Sun
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  const keys = [];
  for (let i = 0; i < 5; i++) {
    keys.push(toKey(date));
    date.setDate(date.getDate() + 1);
  }
  return keys;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeBalances(year) {
  const hours = {};            // daily type → hours used
  const weeks = {};            // weekly type → Set of Monday keys
  // Types that also count earlier years (parental: 1 back, sabbatical: 4 back)
  const lookback = new Map(BALANCES.filter(b => b.lookbackYears).map(b => [b.status, b.lookbackYears]));
  for (const [key, s] of Object.entries(state.days)) {
    if (isWeekly(s)) {
      // A week counts once (even if a holiday sits inside it), by the year of its Monday
      const monday = weekKeys(key)[0];
      const mondayYear = Number(monday.slice(0, 4));
      const oldest = year - (lookback.get(s) ?? 0);
      if (mondayYear > year || mondayYear < oldest) continue;
      (weeks[s] ??= new Set()).add(monday);
    } else if (isOOO(s) && key.startsWith(`${year}-`)) {
      hours[s] = (hours[s] ?? 0) + HOURS_PER_DAY;
    }
  }
  return BALANCES.map(b => {
    if (b.unit !== 'hours') return { ...b, used: weeks[b.status]?.size ?? 0 };
    const added = state.adjust[year]?.[b.status] ?? 0;
    return { ...b, added, used: Math.max(0, (hours[b.status] ?? 0) + added) };
  });
}

function computeStats() {
  const { year, month, requirement } = state;
  const weeks = getCalendarWeeks(year, month);

  let totalInOffice = 0, totalRemote = 0, totalOOO = 0, totalHoliday = 0, totalWFA = 0, totalParental = 0, totalSabbatical = 0;
  let totalWorkingDays = 0; // all Mon–Fri in this month

  for (const week of weeks) {
    for (const date of week) {
      if (date.getMonth() !== month) continue;
      totalWorkingDays++;
      const s = state.days[toKey(date)];
      if      (s === STATUS.IN_OFFICE) { totalInOffice++; }
      else if (s === STATUS.REMOTE)    { totalRemote++;   }
      else if (isOOO(s))               { totalOOO++;      }
      else if (s === STATUS.HOLIDAY)   { totalHoliday++;  }
      else if (s === STATUS.WFA)       { totalWFA++;      }
      else if (s === STATUS.PARENTAL)    { totalParental++;   }
      else if (s === STATUS.SABBATICAL)  { totalSabbatical++; }
    }
  }

  // Threshold: requirement days out of 5 (e.g. 3 days → 60%, 4 days → 80%)
  const threshold   = requirement / 5;
  const hasData     = totalInOffice + totalRemote > 0;
  // Holidays, OOO types and WFA don't count against the denominator
  // (parental leave and sabbatical do)
  const effectiveDays = totalWorkingDays - totalOOO - totalHoliday - totalWFA;

  // Percentage of working days spent in-office
  const avg     = hasData ? (totalInOffice / effectiveDays) * 100 : null;
  const onTrack = hasData && (totalInOffice / effectiveDays) >= threshold;

  return {
    inOffice: totalInOffice,
    remote:   totalRemote,
    ooo:      totalOOO,
    holiday:  totalHoliday,
    wfa:      totalWFA,
    parental:   totalParental,
    sabbatical: totalSabbatical,
    avg,
    onTrack,
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
  renderTools();
  renderImportBtn();
  renderPlan();
}

function renderTools() {
  const active = !!state.paintStatus;
  document.querySelectorAll('.paint-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === state.paintStatus);
  });
  document.getElementById('calendar-card').classList.toggle('paint-mode', active);
  renderHeadline(computeStats());

  // OOO type picker: space is always reserved, only visible while OOO is active
  const picker = document.getElementById('ooo-types');
  picker.classList.toggle('is-visible', state.paintStatus === 'ooo');
  picker.querySelectorAll('.ooo-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.oooType);
    btn.tabIndex = state.paintStatus === 'ooo' ? 0 : -1;
  });

  // Undo / redo only appear when there is something to undo / redo
  // When only redo exists, undo keeps its slot (invisible) so redo doesn't shift left
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;
  const undoBtn = document.getElementById('btn-undo');
  undoBtn.hidden = !canUndo && !canRedo;
  undoBtn.classList.toggle('placeholder', !canUndo && canRedo);
  document.getElementById('btn-redo').hidden = !canRedo;

  const hint = document.getElementById('paint-hint');
  if (!active)                              hint.textContent = '';
  else if (isWeekly(state.paintStatus))     hint.textContent = 'Click any day to fill its whole week (holidays are kept). Click the tool again to stop.';
  else                                      hint.textContent = 'Click or drag across days. Click the tool again to stop.';
}

// Header status indicator: paint mode (rainbow) wins over behind (orange)
function renderHeadline(stats) {
  const target = `${(state.requirement / 5 * 100).toFixed(0)}%`;
  const status = stats.avg === null ? 'Paint some days'
               : stats.onTrack      ? 'On track'
               :                      'Behind';
  const painting = !!state.paintStatus;

  document.getElementById('headline-value').textContent =
    stats.avg !== null ? `${stats.avg.toFixed(1)}%` : 'No data';
  document.getElementById('headline-note').textContent =
    `${status}. Target ${target} of days`;

  // Centered header label while a paint tool is active
  const mode   = document.getElementById('header-mode');
  const target_ = paintTarget();
  mode.hidden  = !painting;
  if (painting) {
    mode.textContent = target_ === STATUS.NONE
      ? 'Erasing'
      : `Painting - ${STATUS_META[target_].label}`;
  }

  const header = document.querySelector('.tracker-header');
  if (painting)                                   header.dataset.state = 'paint';
  else if (stats.avg !== null && !stats.onTrack)  header.dataset.state = 'behind';
  else                                            delete header.dataset.state;
}

function renderSidebar() {
  const stats = computeStats();

  // Requirement buttons
  document.querySelectorAll('.req-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.req) === state.requirement);
  });

  document.getElementById('stat-target').textContent    = `${(state.requirement / 5 * 100).toFixed(0)}% of days`;
  document.getElementById('stat-in-office').textContent = stats.inOffice;
  document.getElementById('stat-remote').textContent    = stats.remote;
  document.getElementById('stat-ooo').textContent       = stats.ooo;
  document.getElementById('stat-holiday').textContent   = stats.holiday;
  document.getElementById('stat-wfa').textContent       = stats.wfa;
  // Parental / Sabbatical rows appear only once there is a yearly balance for them
  const yearly = computeBalances(state.year);
  for (const s of [STATUS.PARENTAL, STATUS.SABBATICAL]) {
    document.getElementById(`row-${s}`).hidden = !(yearly.find(b => b.status === s)?.used > 0);
    document.getElementById(`stat-${s}`).textContent = stats[s];
  }
  renderBalances();

  renderHeadline(stats);

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

// Days by default; hours only when they don't divide evenly into days
function fmtDur(hours) {
  const h    = Math.abs(hours);
  const days = Math.floor(h / HOURS_PER_DAY);
  const rem  = h % HOURS_PER_DAY;
  const parts = [];
  if (days || !rem) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (rem)          parts.push(`${rem} ${rem === 1 ? 'hour' : 'hours'}`);
  return parts.join(', ');
}

function adjustBalance(status, deltaHours) {
  const y = state.year;
  state.adjust[y] ??= {};
  const prev = state.adjust[y][status] ?? 0;
  const next = prev + deltaHours;
  setAdjust(y, status, next);
  state.undoStack.push({ before: {}, after: {}, adjust: { year: y, status, before: prev, after: next } });
  state.redoStack = [];
  renderBalances();
  renderTools();
}

function setAdjust(year, status, hours) {
  state.adjust[year] ??= {};
  if (hours === 0) delete state.adjust[year][status];
  else             state.adjust[year][status] = hours;
  saveAdjust();
}

function renderBalances() {
  document.getElementById('balances-title').textContent = `${state.year} balances`;
  const list = document.getElementById('balances');
  list.innerHTML = '';

  for (const b of computeBalances(state.year)) {
    // Optional types only show once used (hour-based ones also while editing, so time can be added)
    if (!b.always && b.used === 0 && !(state.editBalances && b.unit === 'hours')) continue;

    const hasMax = b.max !== undefined;
    const row = document.createElement('div');
    row.className = 'bal-row';
    if (hasMax && b.used > b.max) row.classList.add('over');
    row.dataset.status = b.status;

    const head = document.createElement('div');
    head.className = 'bal-head';
    const name = document.createElement('span');
    name.className   = 'bal-name';
    name.textContent = b.name;
    const used = document.createElement('span');
    used.className = 'bal-used';
    if (b.unit === 'hours') {
      used.textContent = fmtDur(b.used);
    } else {
      used.textContent = `${b.used} ${b.used === 1 ? 'week' : 'weeks'}`;
    }
    head.append(name, used);
    row.appendChild(head);

    const subRow = document.createElement('div');
    subRow.className = 'bal-sub-row';
    const sub = document.createElement('div');
    sub.className = 'bal-sub';
    if (hasMax) {
      const bar = document.createElement('div');
      bar.className = 'bal-bar';
      const fill = document.createElement('span');
      fill.style.width = `${Math.min(100, (b.used / b.max) * 100)}%`;
      bar.appendChild(fill);
      row.appendChild(bar);

      const left = b.max - b.used;
      if (left < 0) {
        sub.textContent = b.unit === 'hours'
          ? `${fmtDur(-left)} over the max`
          : `${-left} over the ${b.max}-week max`;
      } else {
        sub.textContent = b.unit === 'hours'
          ? `${fmtDur(left)} left`
          : `${left} of ${b.max} weeks left`;
      }
    } else {
      sub.textContent = 'No maximum';
    }
    subRow.appendChild(sub);

    if (state.editBalances && b.unit === 'hours') {
      const added = document.createElement('div');
      added.className   = 'bal-added';
      added.textContent = `Added: ${b.added === 0 ? 'none' : (b.added < 0 ? '-' : '') + fmtDur(b.added)}`;
      subRow.appendChild(added);
    }
    row.appendChild(subRow);

    if (state.editBalances && b.unit === 'hours') {
      const btns = document.createElement('div');
      btns.className = 'bal-adjust';
      const steps = [
        ['+ Day',  HOURS_PER_DAY, `Add a day to ${b.name}`],
        ['+ Hour', 1,             `Add an hour to ${b.name}`],
        ['− Hour', -1,            `Subtract an hour from ${b.name}`],
        ['− Day',  -HOURS_PER_DAY, `Subtract a day from ${b.name}`],
      ];
      for (const [text, delta, label] of steps) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = text;
        btn.setAttribute('aria-label', label);
        btn.addEventListener('click', () => adjustBalance(b.status, delta));
        btns.appendChild(btn);
      }
      row.appendChild(btns);
    }
    list.appendChild(row);
  }
}

const NOTE_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M5 3h14a1 1 0 0 1 1 1v10l-6 6H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 20v-5a1 1 0 0 1 1-1h5"/></svg>';

const shortLabel = status =>
  status === STATUS.IN_OFFICE ? 'Office' : (STATUS_META[status].short ?? STATUS_META[status].label);

function getDayLabel(status, key) {
  if (status === STATUS.HOLIDAY) return HOLIDAY_NAMES[key] ?? STATUS_META[status].label;
  return STATUS_META[status].label;
}

function buildStatusLabel(status, key) {
  const el = document.createElement('span');
  el.className     = 'day-status-label';
  el.dataset.short = shortLabel(status);
  el.textContent   = getDayLabel(status, key);
  return el;
}

// First three lines of the note, each on its own line
function buildNotePreview(text) {
  const el = document.createElement('div');
  el.className = 'day-note';
  const lines = text.split('\n').filter(l => l.trim());
  lines.slice(0, 3).forEach((line, i) => {
    const row = document.createElement('span');
    // An ellipsis on the third line signals that more of the note is hidden
    row.textContent = i === 2 && lines.length > 3 ? `${line}…` : line;
    el.appendChild(row);
  });
  return el;
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

      const cell = document.createElement('div');
      cell.className   = 'day-cell';
      cell.dataset.key = key;
      if (status !== STATUS.NONE) cell.dataset.status = status;
      if (isToday)                cell.classList.add('today');
      if (!inCurrentMonth)        cell.classList.add('out-of-month');

      const numEl = document.createElement('span');
      numEl.className   = 'day-num';
      numEl.textContent = date.getDate();
      cell.appendChild(numEl);

      if (status !== STATUS.NONE) {
        cell.appendChild(buildStatusLabel(status, key));
      }

      const note = state.notes[key];
      if (note && inCurrentMonth) {
        cell.appendChild(buildNotePreview(note));
      }

      if (inCurrentMonth) {
        const longDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        // Full-cell button opens the status menu (kept as a sibling of the note
        // button because buttons cannot nest)
        const hit = document.createElement('button');
        hit.type      = 'button';
        hit.className = 'day-hit';
        hit.setAttribute('aria-label', `${longDate}: set status`);
        hit.addEventListener('click', e => {
          if (!state.paintStatus) onDayClick(e, key, cell);
        });
        cell.appendChild(hit);

        const noteBtn = document.createElement('button');
        noteBtn.type      = 'button';
        noteBtn.className = 'note-btn';
        noteBtn.setAttribute('aria-label', `${note ? 'Edit' : 'Add'} note for ${longDate}`);
        noteBtn.innerHTML = NOTE_ICON;
        noteBtn.addEventListener('mousedown', e => e.stopPropagation());
        noteBtn.addEventListener('click', e => { e.stopPropagation(); openNote(key, longDate); });
        cell.appendChild(noteBtn);

        cell.addEventListener('mousedown', e => {
          if (!state.paintStatus) return;
          e.preventDefault(); // prevent text selection while dragging
          state.isPainting  = true;
          state.strokeStart = { ...state.days };
          applyPaint(key);
        });
        cell.addEventListener('mouseover', () => {
          if (state.isPainting && state.paintStatus) applyPaint(key);
        });
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
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Set day status');
  pop.addEventListener('click', e => e.stopPropagation());

  const current = state.days[key] ?? STATUS.NONE;

  const makeOption = s => {
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

    if (s === STATUS.NONE && current !== STATUS.NONE) btn.classList.add('popover-clear');

    btn.addEventListener('click', () => onStatusSelect(key, s));
    return btn;
  };

  // Common statuses always show; the rest sit under "More" (open by default
  // when the day already has one of them, so the selection is never hidden)
  const COMMON = [STATUS.IN_OFFICE, STATUS.REMOTE, STATUS.VACATION, STATUS.SICK, STATUS.HOLIDAY];
  const MORE_DAILY = [STATUS.CAREGIVER, STATUS.BEREAVEMENT];
  const hiddenStatuses = [...MORE_DAILY, ...WEEKLY_TYPES];

  COMMON.forEach(s => pop.appendChild(makeOption(s)));

  const moreBtn = document.createElement('button');
  moreBtn.type      = 'button';
  moreBtn.className = 'popover-more';
  const more = document.createElement('div');
  more.className = 'popover-more-list';

  MORE_DAILY.forEach(s => more.appendChild(makeOption(s)));
  const note = document.createElement('div');
  note.className   = 'popover-note';
  note.textContent = 'Sets entire week';
  more.appendChild(note);
  WEEKLY_TYPES.forEach(s => more.appendChild(makeOption(s)));

  const setMore = open => {
    more.hidden = !open;
    moreBtn.setAttribute('aria-expanded', String(open));
    moreBtn.textContent = open ? 'More ▴' : 'More ▾';
  };
  setMore(hiddenStatuses.includes(current));
  moreBtn.addEventListener('click', () => {
    setMore(more.hidden);
    positionPopover(pop, anchorEl); // height changed: keep it on screen
  });

  pop.append(moreBtn, more, makeOption(STATUS.NONE));

  document.body.appendChild(pop);
  positionPopover(pop, anchorEl);
  pop.querySelector('.popover-option.selected, .popover-option')?.focus();
}

// ─── Sticky note modal ────────────────────────────────────────────────────────

const noteDialog = document.getElementById('note-dialog');
const noteText   = document.getElementById('note-text');
let   noteKey    = null;

function openNote(key, longDate) {
  closePopover();
  noteKey = key;
  document.getElementById('note-title').textContent = longDate;
  noteText.value = state.notes[key] ?? '';
  document.getElementById('note-delete').hidden = !state.notes[key];
  noteDialog.showModal();
  noteText.focus();
}

function commitNote() {
  if (!noteKey) return;
  const value = noteText.value;
  if (value.trim()) state.notes[noteKey] = value.trim();
  else              delete state.notes[noteKey];
  saveNotes();
  const key = noteKey;
  noteKey = null;
  renderCalendarCells();
  document.querySelector(`.day-cell[data-key="${key}"] .note-btn`)?.focus();
}

noteText.addEventListener('input', () => {
  document.getElementById('note-delete').hidden = !noteText.value.trim();
});

noteDialog.addEventListener('close', commitNote);

document.getElementById('note-delete').addEventListener('click', () => {
  noteText.value = '';
  noteDialog.close();
});

// Click on the backdrop (outside the sticky) saves and closes
noteDialog.addEventListener('mousedown', e => {
  if (e.target === noteDialog) noteDialog.close();
});

function positionPopover(pop, anchor) {
  const ar = anchor.getBoundingClientRect();
  const ph = pop.offsetHeight;
  const pw = pop.offsetWidth;
  let top  = ar.bottom + 6;
  let left = ar.left;

  // Flip above if clipped at bottom
  if (top + ph > window.innerHeight - 8) top = Math.max(8, ar.top - ph - 6);
  // Clamp horizontally
  if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
  if (left < 8) left = 8;

  pop.style.top  = `${top}px`;
  pop.style.left = `${left}px`;
}

function closePopover() {
  document.getElementById('day-popover')?.remove();
  state.activePopoverKey = null;
}

function onStatusSelect(key, status) {
  const before  = { ...state.days };
  const current = state.days[key];
  if (isWeekly(status))                                 fillWeek(key, status);          // whole week, holidays kept
  else if (status === STATUS.NONE && isWeekly(current)) clearWeek(key, current);        // clearing a weekly day clears the week
  else if (status === STATUS.NONE)                      delete state.days[key];
  else                                                  state.days[key] = status;

  saveDays();
  recordDayChange(before);
  closePopover();
  renderCalendarCells();
  renderSidebar();

  const cell = document.querySelector(`.day-cell[data-key="${key}"]`);
  cell?.querySelector('.day-hit')?.focus();
  cell?.querySelector('.day-status-label')?.classList.add('stamp');
}

// ─── Paint ────────────────────────────────────────────────────────────────────

// Set one day's status in state and update its cell in place (no grid rebuild)
function setDay(key, status) {
  const cellEl = document.querySelector(`.day-cell[data-key="${key}"]`);

  if (status === STATUS.NONE) {
    delete state.days[key];
    if (cellEl) {
      delete cellEl.dataset.status;
      cellEl.querySelector('.day-status-label')?.remove();
    }
    return;
  }

  state.days[key] = status;
  if (!cellEl) return;
  cellEl.dataset.status = status;

  const prev = cellEl.querySelector('.day-status-label');
  if (prev?.dataset.short !== shortLabel(status) || prev.textContent !== getDayLabel(status, key)) {
    prev?.remove();
    const labelEl = buildStatusLabel(status, key);
    labelEl.classList.add('stamp');
    cellEl.querySelector('.day-num').after(labelEl);
  }
}

// Fill Mon–Fri of a week with a weekly status. Holidays are never overwritten.
function fillWeek(anyKey, status) {
  for (const k of weekKeys(anyKey)) {
    if (state.days[k] === STATUS.HOLIDAY) continue;
    setDay(k, status);
  }
}

function clearWeek(anyKey, status) {
  for (const k of weekKeys(anyKey)) {
    if (state.days[k] === status) setDay(k, STATUS.NONE);
  }
}

function applyPaint(key) {
  const status = paintTarget();
  const current = state.days[key];
  if (isWeekly(status))                             fillWeek(key, status);
  else if (status === STATUS.NONE && isWeekly(current)) clearWeek(key, current); // eraser removes the whole week
  else                                              setDay(key, status);
  renderSidebar();
}

function clearMonth() {
  const before = { ...state.days };
  const prefix = `${state.year}-${String(state.month + 1).padStart(2, '0')}-`;
  for (const key of Object.keys(state.days)) {
    if (key.startsWith(prefix)) delete state.days[key];
  }
  saveDays();
  recordDayChange(before);
  renderCalendarCells();
  renderSidebar();
}

function importHolidays() {
  const holidays = HOLIDAYS[state.year] ?? [];
  const before = { ...state.days };
  let imported = 0;
  for (const { date } of holidays) {
    if (state.days[date] !== STATUS.HOLIDAY) {
      state.days[date] = STATUS.HOLIDAY;
      imported++;
    }
  }
  if (imported > 0) {
    saveDays();
    recordDayChange(before);
    renderCalendarCells();
    renderSidebar();
  }
  showToast(imported > 0
    ? `${imported} holiday${imported !== 1 ? 's' : ''} imported for ${state.year}`
    : `All ${state.year} holidays already imported`
  );
}

function renderImportBtn() {
  const btn = document.getElementById('btn-import-holidays');
  const hasHolidays = !!(HOLIDAYS[state.year]?.length);
  btn.disabled = !hasHolidays;
  btn.textContent = `Import ${state.year} US Holidays`;
}

// ─── Notes & to-dos ───────────────────────────────────────────────────────────

function monthKey() {
  return `${state.year}-${String(state.month + 1).padStart(2, '0')}`;
}

function getMonthPlan() {
  const k = monthKey();
  state.plan[k] ??= { notes: '', todos: [] };
  return state.plan[k];
}

function renderPlan() {
  const plan = state.plan[monthKey()] ?? { notes: '', todos: [] };

  document.getElementById('plan-title').textContent =
    `${MONTH_NAMES[state.month]} notes`;

  const notesEl = document.getElementById('month-notes');
  if (notesEl !== document.activeElement) notesEl.value = plan.notes;

  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  if (plan.todos.length === 0) {
    const empty = document.createElement('li');
    empty.className   = 'todo-empty';
    empty.textContent = 'No to-dos for this month.';
    list.appendChild(empty);
    return;
  }

  for (const todo of plan.todos) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    const box = document.createElement('input');
    box.type    = 'checkbox';
    box.checked = todo.done;
    box.id      = `todo-${todo.id}`;
    box.addEventListener('change', () => {
      todo.done = box.checked;
      savePlan();
      renderPlan();
    });

    const text = document.createElement('label');
    text.className   = 'todo-text';
    text.htmlFor     = box.id;
    text.textContent = todo.text;

    const remove = document.createElement('button');
    remove.type      = 'button';
    remove.className = 'todo-remove';
    remove.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    remove.setAttribute('aria-label', `Remove to-do: ${todo.text}`);
    remove.addEventListener('click', () => {
      const p = getMonthPlan();
      p.todos = p.todos.filter(t => t.id !== todo.id);
      savePlan();
      renderPlan();
    });

    li.append(box, text, remove);
    list.appendChild(li);
  }
}

document.getElementById('month-notes').addEventListener('input', e => {
  getMonthPlan().notes = e.target.value;
  savePlan();
});

document.getElementById('todo-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('todo-input');
  const text  = input.value.trim();
  if (!text) return;
  getMonthPlan().todos.push({ id: Date.now().toString(36), text, done: false });
  savePlan();
  input.value = '';
  renderPlan();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (noteDialog.open) return; // Escape closes the note editor only

  // Esc exits paint mode
  if (state.paintStatus) {
    state.paintStatus = null;
    renderTools();
    return;
  }

  const key = state.activePopoverKey;
  closePopover();
  closeClearPopover();
  if (key) document.querySelector(`.day-cell[data-key="${key}"] .day-hit`)?.focus();
});

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

document.querySelectorAll('.paint-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.paintStatus = state.paintStatus === btn.dataset.status ? null : btn.dataset.status;
    closePopover();
    renderTools();
  });
});

document.querySelectorAll('.ooo-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.oooType = btn.dataset.type;
    renderTools();
  });
});

document.getElementById('btn-edit-balances').addEventListener('click', e => {
  state.editBalances = !state.editBalances;
  e.currentTarget.setAttribute('aria-pressed', String(state.editBalances));
  e.currentTarget.classList.toggle('on', state.editBalances);
  renderBalances();
});

document.getElementById('btn-import-holidays').addEventListener('click', importHolidays);

document.getElementById('btn-clear-month').addEventListener('click', e => {
  e.stopPropagation();
  if (document.getElementById('clear-popover')) { closeClearPopover(); return; }
  openClearPopover();
});

function openClearPopover() {
  const anchor = document.getElementById('btn-clear-month');

  const pop = document.createElement('div');
  pop.id        = 'clear-popover';
  pop.className = 'clear-popover';
  pop.addEventListener('click', e => e.stopPropagation());

  const msg = document.createElement('p');
  msg.className   = 'clear-popover-msg';
  msg.textContent = `Clear ${MONTH_NAMES[state.month]} ${state.year}?`;

  const actions = document.createElement('div');
  actions.className = 'clear-popover-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type      = 'button';
  cancelBtn.className = 'clear-popover-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', closeClearPopover);

  const confirmBtn = document.createElement('button');
  confirmBtn.type      = 'button';
  confirmBtn.className = 'clear-popover-confirm';
  confirmBtn.textContent = 'Clear';
  confirmBtn.addEventListener('click', () => { clearMonth(); closeClearPopover(); });

  actions.append(cancelBtn, confirmBtn);
  pop.append(msg, actions);
  document.body.appendChild(pop);

  // Position above and right-aligned with the button
  const r = anchor.getBoundingClientRect();
  pop.style.bottom = `${window.innerHeight - r.top + 8}px`;
  pop.style.right  = `${window.innerWidth  - r.right}px`;
}

function closeClearPopover() {
  document.getElementById('clear-popover')?.remove();
}

function showToast(message) {
  document.getElementById('app-toast')?.remove();
  const toast = document.createElement('div');
  toast.id        = 'app-toast';
  toast.className = 'app-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('app-toast--visible'));
  setTimeout(() => {
    toast.classList.remove('app-toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3000);
}

document.addEventListener('mouseup', () => {
  if (state.isPainting) {
    state.isPainting = false;
    saveDays();
    recordStroke();
  }
});

// ─── Undo / redo (paint strokes and manual changes) ───────────────────────────

function recordStroke() {
  const start = state.strokeStart;
  state.strokeStart = null;
  recordDayChange(start);
}

// Store only the days that changed since `prevDays`, so undoing never touches other edits
function recordDayChange(prevDays) {
  const before = {}, after = {};
  const keys = new Set([...Object.keys(prevDays ?? {}), ...Object.keys(state.days)]);
  for (const k of keys) {
    if (prevDays?.[k] !== state.days[k]) {
      before[k] = prevDays?.[k];
      after[k]  = state.days[k];
    }
  }
  if (Object.keys(after).length === 0) return;
  state.undoStack.push({ before, after });
  state.redoStack = [];
  renderTools();
}

function applyHistory(entry, direction) {
  for (const [k, s] of Object.entries(entry[direction])) {
    if (s === undefined) delete state.days[k];
    else                 state.days[k] = s;
  }
  if (entry.adjust) setAdjust(entry.adjust.year, entry.adjust.status, entry.adjust[direction]);
  saveDays();
  renderCalendarCells();
  renderSidebar();
  renderTools();
}

document.getElementById('btn-undo').addEventListener('click', () => {
  const entry = state.undoStack.pop();
  if (!entry) return;
  state.redoStack.push(entry);
  applyHistory(entry, 'before');
});

document.getElementById('btn-redo').addEventListener('click', () => {
  const entry = state.redoStack.pop();
  if (!entry) return;
  state.undoStack.push(entry);
  applyHistory(entry, 'after');
});

document.addEventListener('click', () => {
  closePopover();
  closeClearPopover();
});

render();
