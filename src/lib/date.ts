const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('es', {
  numeric: 'auto',
})

const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
  ['second', 1000],
]

/**
 * Returns a human-readable relative time string in Spanish.
 * - Past: `"hace 3 días"`, `"hace 5 minutos"`
 * - Future: `"en 5 días"`, `"en 2 horas"`
 */
export function formatRelative(timestamp: number | Date): string {
  const then = typeof timestamp === 'number' ? timestamp : timestamp.getTime()
  const diff = then - Date.now()
  const absDiff = Math.abs(diff)

  for (const [unit, ms] of UNITS) {
    if (absDiff >= ms || unit === 'second') {
      const value = Math.round(diff / ms)
      return RELATIVE_TIME_FORMATTER.format(value, unit)
    }
  }
  return RELATIVE_TIME_FORMATTER.format(0, 'second')
}

/**
 * Returns an absolute date+time string in Spanish: `"6 abr 2026, 14:30"`.
 * Used as the tooltip content when hovering over a relative timestamp.
 */
export function formatAbsolute(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  return ABSOLUTE_FORMATTER.format(date)
}
