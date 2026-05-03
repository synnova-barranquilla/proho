export const STAFF_ROLES = ['ADMIN', 'AUXILIAR'] as const

export const ALL_COMMS_ROLES = [
  'ADMIN',
  'AUXILIAR',
  'OWNER',
  'TENANT',
  'LESSEE',
] as const

export const CLOSED_STATUSES = [
  'closed_by_bot',
  'closed_by_admin',
  'closed_by_inactivity',
] as const

export const PRIORITY_RANK = { high: 3, medium: 2, low: 1 } as const
