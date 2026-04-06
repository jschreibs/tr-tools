export const STATUS = Object.freeze({
  NONE:      'none',
  IN_OFFICE: 'in-office',
  REMOTE:    'remote',
  OOO:       'ooo',
});

export const STATUS_META = Object.freeze({
  [STATUS.NONE]:      { label: 'Clear',     bg: null,      fg: '#6b7280' },
  [STATUS.IN_OFFICE]: { label: 'In Office', bg: '#dcfce7', fg: '#166534' },
  [STATUS.REMOTE]:    { label: 'Remote',    bg: '#dbeafe', fg: '#1e40af' },
  [STATUS.OOO]:       { label: 'OOO',       bg: '#fef3c7', fg: '#92400e' },
});

export const REQUIREMENTS = Object.freeze([3, 4]);

export const STORAGE_KEYS = Object.freeze({
  DAYS:        'tr-attendance-days',
  REQUIREMENT: 'tr-attendance-requirement',
});
