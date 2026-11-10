export const STATUS = Object.freeze({
  NONE:      'none',
  IN_OFFICE: 'in-office',
  REMOTE:    'remote',
  OOO:       'ooo',
  HOLIDAY:   'holiday',
});

export const STATUS_META = Object.freeze({
  [STATUS.NONE]:      { label: 'Clear',     bg: null,      fg: '#4d5a52' },
  [STATUS.IN_OFFICE]: { label: 'In Office', bg: '#1d4b34', fg: '#ffffff' },
  [STATUS.REMOTE]:    { label: 'Remote',    bg: '#2a5b8c', fg: '#ffffff' },
  [STATUS.OOO]:       { label: 'OOO',       bg: '#f2c230', fg: '#14281e' },
  [STATUS.HOLIDAY]:   { label: 'Holiday',   bg: '#d64000', fg: '#ffffff' },
});

export const REQUIREMENTS = Object.freeze([3, 4]);

export const STORAGE_KEYS = Object.freeze({
  DAYS:        'tr-attendance-days',
  REQUIREMENT: 'tr-attendance-requirement',
  NOTES:       'tr-attendance-notes', // { 'YYYY-MM-DD': text }
  PLAN:        'tr-attendance-plan',  // { 'YYYY-MM': { notes: text, todos: [{ id, text, done }] } }
});
