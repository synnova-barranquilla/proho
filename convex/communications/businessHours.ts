import { defaultBusinessHours } from '../complexConfig/validators'

type DaySchedule = { start: number; end: number; open: boolean }

export type BusinessHours = {
  mon: DaySchedule
  tue: DaySchedule
  wed: DaySchedule
  thu: DaySchedule
  fri: DaySchedule
  sat: DaySchedule
  sun: DaySchedule
}

const DAY_KEYS = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
] as const satisfies readonly (keyof BusinessHours)[]

/**
 * Returns the current day key and minutes since midnight for the given timezone.
 */
function getCurrentTimeInTimezone(timezone: string): {
  dayKey: keyof BusinessHours
  minutes: number
  date: Date
} {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const weekday = parts
    .find((p) => p.type === 'weekday')!
    .value.toLowerCase()
    .slice(0, 3) as keyof BusinessHours
  const hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10)
  const minute = parseInt(parts.find((p) => p.type === 'minute')!.value, 10)

  return { dayKey: weekday, minutes: hour * 60 + minute, date: now }
}

/**
 * Returns true if the current time falls within the configured business hours.
 */
export function isBusinessHours(
  businessHours?: BusinessHours,
  timezone?: string,
): boolean {
  const bh = businessHours ?? defaultBusinessHours
  const tz = timezone ?? 'America/Bogota'
  const { dayKey, minutes } = getCurrentTimeInTimezone(tz)

  const schedule = bh[dayKey]
  if (!schedule.open) return false

  return minutes >= schedule.start && minutes < schedule.end
}

/**
 * Returns an ISO string for the next business-hours opening time.
 * Looks up to 7 days ahead. Falls back to 24h from now if nothing is open.
 */
export function getNextOpenTime(
  businessHours?: BusinessHours,
  timezone?: string,
): string {
  const bh = businessHours ?? defaultBusinessHours
  const tz = timezone ?? 'America/Bogota'
  const { dayKey, minutes, date } = getCurrentTimeInTimezone(tz)

  const todayIndex = DAY_KEYS.indexOf(dayKey)

  // Check rest of today first
  const todaySchedule = bh[dayKey]
  if (todaySchedule.open && minutes < todaySchedule.start) {
    // Today is open and we haven't reached the start yet
    const diffMinutes = todaySchedule.start - minutes
    return new Date(date.getTime() + diffMinutes * 60_000).toISOString()
  }

  // Check next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const nextIndex = (todayIndex + offset) % 7
    const nextDayKey = DAY_KEYS[nextIndex]
    const schedule = bh[nextDayKey]
    if (schedule.open) {
      const diffMinutes = offset * 24 * 60 - minutes + schedule.start
      return new Date(date.getTime() + diffMinutes * 60_000).toISOString()
    }
  }

  // Fallback: 24h from now
  return new Date(date.getTime() + 24 * 60 * 60_000).toISOString()
}

/**
 * Returns a user-facing message in Spanish indicating the bot is outside
 * business hours and when it will next be available.
 */
export function getBusinessHoursMessage(
  businessHours?: BusinessHours,
  timezone?: string,
): string {
  const nextOpen = getNextOpenTime(businessHours, timezone)
  const nextDate = new Date(nextOpen)
  const now = new Date()

  const diffMs = nextDate.getTime() - now.getTime()
  const diffHours = Math.max(1, Math.round(diffMs / (60 * 60_000)))

  if (diffHours <= 1) {
    return 'Auxiliar Operativo fuera de horario laboral, se asignará para revisión en menos de 1 hora de ser necesario.'
  }

  return `Auxiliar Operativo fuera de horario laboral, se asignará para revisión en aproximadamente ${diffHours} horas de ser necesario.`
}
