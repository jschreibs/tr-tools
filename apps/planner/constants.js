export const STATUS = Object.freeze({
  NONE:         'none',
  IN_OFFICE:    'in-office',
  REMOTE:       'remote',
  HOLIDAY:      'holiday',
  // OOO types (daily, yellow)
  VACATION:     'vacation',
  SICK:         'sick',
  CAREGIVER:    'caregiver',
  BEREAVEMENT:  'bereavement',
  // Weekly types (Mon–Fri, purple)
  WFA:          'wfa',
  PARENTAL:     'parental',
  SABBATICAL:   'sabbatical',
});

const YELLOW = '#f2c230';
const PURPLE = '#6b3fa0';

export const STATUS_META = Object.freeze({
  [STATUS.NONE]:        { label: 'Clear',           bg: null,      fg: '#4d5a52' },
  [STATUS.IN_OFFICE]:   { label: 'In Office',       bg: '#1d4b34', fg: '#ffffff' },
  [STATUS.REMOTE]:      { label: 'Remote',          bg: '#2a5b8c', fg: '#ffffff' },
  [STATUS.HOLIDAY]:     { label: 'Holiday',         bg: '#d64000', fg: '#ffffff' },
  [STATUS.VACATION]:    { label: 'Vacation',        short: 'Vacation', bg: YELLOW, fg: '#14281e' },
  [STATUS.SICK]:        { label: 'Sick',            short: 'Sick',     bg: YELLOW, fg: '#14281e' },
  [STATUS.CAREGIVER]:   { label: 'Caregiver',       short: 'Caregiver',bg: YELLOW, fg: '#14281e' },
  [STATUS.BEREAVEMENT]: { label: 'Bereavement',     short: 'Bereave',  bg: YELLOW, fg: '#14281e' },
  [STATUS.WFA]:         { label: 'WFA',             bg: PURPLE,   fg: '#ffffff' },
  [STATUS.PARENTAL]:    { label: 'Parental Leave',  short: 'Parental', bg: PURPLE, fg: '#ffffff' },
  [STATUS.SABBATICAL]:  { label: 'Sabbatical',      short: 'Sabbat.',  bg: PURPLE, fg: '#ffffff' },
});

export const OOO_TYPES    = Object.freeze([STATUS.VACATION, STATUS.SICK, STATUS.CAREGIVER, STATUS.BEREAVEMENT]);
export const WEEKLY_TYPES = Object.freeze([STATUS.WFA, STATUS.PARENTAL, STATUS.SABBATICAL]);

export const HOURS_PER_DAY = 8;

// Yearly balances. Daily types are tracked in hours, weekly types in whole weeks.
// `max` omitted = no cap. `always` = shown even when unused.
export const BALANCES = Object.freeze([
  { status: STATUS.VACATION,   name: 'Vacation',        unit: 'hours', always: true },
  { status: STATUS.SICK,       name: 'Sick time',       unit: 'hours', max: 80, always: true },
  { status: STATUS.WFA,        name: 'Work from anywhere', unit: 'weeks', max: 8, always: true },
  { status: STATUS.CAREGIVER,  name: 'Caregiver leave', unit: 'hours', max: 80 },
  { status: STATUS.BEREAVEMENT, name: 'Bereavement',    unit: 'hours' },
  // lookbackYears: year X also counts weeks taken in the previous N years
  { status: STATUS.PARENTAL,   name: 'Parental leave',  unit: 'weeks', max: 16, lookbackYears: 1 },
  { status: STATUS.SABBATICAL, name: 'Sabbatical',      unit: 'weeks', max: 24, lookbackYears: 4 },
]);

export const REQUIREMENTS = Object.freeze([3, 4]);

export const STORAGE_KEYS = Object.freeze({
  DAYS:        'tr-attendance-days',
  REQUIREMENT: 'tr-attendance-requirement',
  NOTES:       'tr-attendance-notes', // { 'YYYY-MM-DD': text }
  PLAN:        'tr-attendance-plan',  // { 'YYYY-MM': { notes: text, todos: [{ id, text, done }] } }
  ADJUST:      'tr-attendance-adjust', // { 'YYYY': { [status]: manual hours added (may be negative) } }
});
