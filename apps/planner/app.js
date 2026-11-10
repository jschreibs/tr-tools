import { STATUS, STATUS_META, REQUIREMENTS, STORAGE_KEYS } from './constants.js';
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
  activePopoverKey: null,
  paintStatus:      null,  // STATUS.* when paint mode is on
  isPainting:       false,
};

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadJSON(storageKey) {
  try { return JSON.parse(localStorage.getItem(storageKey)) ?? {}; }
  catch { return {}; }
}

function loadDays() { return loadJSON(STORAGE_KEYS.DAYS); }

function loadRequirement() {
  const v = parseInt(localStorage.getItem(STORAGE_KEYS.REQUIREMENT), 10);
  return REQUIREMENTS.includes(v) ? v : REQUIREMENTS[0];
}

function saveDays()        { localStorage.setItem(STORAGE_KEYS.DAYS,        JSON.stringify(state.days)); }
function saveRequirement() { localStorage.setItem(STORAGE_KEYS.REQUIREMENT, String(state.requirement)); }
function saveNotes()       { localStorage.setItem(STORAGE_KEYS.NOTES,       JSON.stringify(state.notes)); }
function savePlan()        { localStorage.setItem(STORAGE_KEYS.PLAN,        JSON.stringify(state.plan)); }

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

  let totalInOffice = 0, totalRemote = 0, totalOOO = 0, totalHoliday = 0;
  let totalWorkingDays = 0; // all Mon–Fri in this month

  for (const week of weeks) {
    for (const date of week) {
      if (date.getMonth() !== month) continue;
      totalWorkingDays++;
      const s = state.days[toKey(date)];
      if      (s === STATUS.IN_OFFICE) { totalInOffice++; }
      else if (s === STATUS.REMOTE)    { totalRemote++;   }
      else if (s === STATUS.OOO)       { totalOOO++;      }
      else if (s === STATUS.HOLIDAY)   { totalHoliday++;  }
    }
  }

  // Threshold: requirement days out of 5 (e.g. 3 days → 60%, 4 days → 80%)
  const threshold   = requirement / 5;
  const hasData     = totalInOffice + totalRemote > 0;
  // Holidays and OOO don't count against the denominator
  const effectiveDays = totalWorkingDays - totalOOO - totalHoliday;

  // Percentage of working days spent in-office
  const avg     = hasData ? (totalInOffice / effectiveDays) * 100 : null;
  const onTrack = hasData && (totalInOffice / effectiveDays) >= threshold;

  return {
    inOffice: totalInOffice,
    remote:   totalRemote,
    ooo:      totalOOO,
    holiday:  totalHoliday,
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
  document.getElementById('paint-mode-title').classList.toggle('rainbow', active);

  const hint = document.getElementById('paint-hint');
  hint.hidden = !active;
  if (active) {
    hint.textContent = `Click or drag across days. Click the tool again to stop.`;
  }
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

  const target = `${(state.requirement / 5 * 100).toFixed(0)}%`;
  document.getElementById('headline-value').textContent =
    stats.avg !== null ? `${stats.avg.toFixed(1)}%` : 'No data';
  document.getElementById('headline-note').textContent =
    stats.avg === null ? `Paint some days. Target ${target} of days`
    : stats.onTrack    ? `On track. Target ${target} of days`
    :                    `Behind. Target ${target} of days`;

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

const NOTE_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M5 3h14a1 1 0 0 1 1 1v10l-6 6H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 20v-5a1 1 0 0 1 1-1h5"/></svg>';

const SHORT_LABELS = {
  [STATUS.IN_OFFICE]: 'Office',
  [STATUS.REMOTE]:    'Remote',
  [STATUS.OOO]:       'OOO',
  [STATUS.HOLIDAY]:   'Holiday',
};

function getDayLabel(status, key) {
  if (status === STATUS.HOLIDAY) return HOLIDAY_NAMES[key] ?? STATUS_META[status].label;
  return STATUS_META[status].label;
}

function buildStatusLabel(status, key) {
  const el = document.createElement('span');
  el.className     = 'day-status-label';
  el.dataset.short = SHORT_LABELS[status];
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
          state.isPainting = true;
          applyPaint(key, cell);
        });
        cell.addEventListener('mouseover', () => {
          if (state.isPainting && state.paintStatus) applyPaint(key, cell);
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

  for (const s of [STATUS.IN_OFFICE, STATUS.REMOTE, STATUS.OOO, STATUS.HOLIDAY, STATUS.NONE]) {
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
  if (status === STATUS.NONE) delete state.days[key];
  else                        state.days[key] = status;

  saveDays();
  closePopover();
  renderCalendarCells();
  renderSidebar();

  const cell = document.querySelector(`.day-cell[data-key="${key}"]`);
  cell?.querySelector('.day-hit')?.focus();
  cell?.querySelector('.day-status-label')?.classList.add('stamp');
}

// ─── Paint ────────────────────────────────────────────────────────────────────

function applyPaint(key, cellEl) {
  const status = state.paintStatus;

  if (status === STATUS.NONE) {
    delete state.days[key];
    delete cellEl.dataset.status;
    cellEl.querySelector('.day-status-label')?.remove();
  } else {
    state.days[key] = status;
    cellEl.dataset.status = status;

    const prev = cellEl.querySelector('.day-status-label');
    if (prev?.dataset.short !== SHORT_LABELS[status] || prev.textContent !== getDayLabel(status, key)) {
      prev?.remove();
      const labelEl = buildStatusLabel(status, key);
      labelEl.classList.add('stamp');
      cellEl.querySelector('.day-num').after(labelEl);
    }
  }

  renderSidebar();
}

function clearMonth() {
  const prefix = `${state.year}-${String(state.month + 1).padStart(2, '0')}-`;
  for (const key of Object.keys(state.days)) {
    if (key.startsWith(prefix)) delete state.days[key];
  }
  saveDays();
  renderCalendarCells();
  renderSidebar();
}

function importHolidays() {
  const holidays = HOLIDAYS[state.year] ?? [];
  let imported = 0;
  for (const { date } of holidays) {
    if (state.days[date] !== STATUS.HOLIDAY) {
      state.days[date] = STATUS.HOLIDAY;
      imported++;
    }
  }
  if (imported > 0) {
    saveDays();
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
  }
});

document.addEventListener('click', () => {
  closePopover();
  closeClearPopover();
});

render();
