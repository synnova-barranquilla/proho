import type { Id } from '../../../convex/_generated/dataModel'
import {
  DAY_KEYS,
  type DayKey,
  type WeekdayAvailability,
} from '../../../convex/socialZones/validators'

// ---------------------------------------------------------------------------
// Types (still needed by booking-dialog for computeEndTimeOptions)
// ---------------------------------------------------------------------------

export interface ZoneForAvailability {
  _id: Id<'socialZones'>
  name: string
  colorIndex: number
  blockDurationMinutes: number
  maxConsecutiveBlocks: number
  weekdayAvailability: WeekdayAvailability
}

export interface BookingForAvailability {
  _id: Id<'socialZoneBookings'>
  zoneId: Id<'socialZones'>
  date: string
  startMinutes: number
  endMinutes: number
}

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

export function formatTime12h(minutes: number): string {
  const total = minutes % 1440
  const h24 = Math.floor(total / 60)
  const m = total % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins} min`
}

// ---------------------------------------------------------------------------
// Select value formatters (for SelectValue.valueFormatterFunction)
// ---------------------------------------------------------------------------

export function minutesValueFormatter(value: unknown) {
  return value != null ? formatTime12h(Number(value)) : null
}

export function endTimeValueFormatter(
  options: Array<{ endMinutes: number; label: string }>,
) {
  return (value: unknown) => {
    if (value == null) return null
    const opt = options.find((o) => o.endMinutes === Number(value))
    return opt?.label ?? formatTime12h(Number(value))
  }
}

// ---------------------------------------------------------------------------
// Day key
// ---------------------------------------------------------------------------

export function isoToDayKey(iso: string): DayKey {
  return DAY_KEYS[new Date(iso + 'T00:00:00').getDay()]
}

// ---------------------------------------------------------------------------
// End-time options for "Hasta" selector (stays in frontend — depends on form state)
// ---------------------------------------------------------------------------

export function computeEndTimeOptions(
  zone: ZoneForAvailability,
  dayKey: DayKey,
  startMinutes: number,
  bookings: BookingForAvailability[],
): Array<{ endMinutes: number; label: string }> {
  const avail = zone.weekdayAvailability[dayKey]
  if (!avail) return []

  const futureBookings = bookings
    .filter(
      (b) => b.zoneId === (zone._id as string) && b.startMinutes > startMinutes,
    )
    .sort((a, b) => a.startMinutes - b.startMinutes)

  const maxEnd =
    futureBookings.length > 0
      ? Math.min(avail.end, futureBookings[0].startMinutes)
      : avail.end
  const step = zone.blockDurationMinutes
  const options: Array<{ endMinutes: number; label: string }> = []

  for (let i = 1; i <= zone.maxConsecutiveBlocks; i++) {
    const end = startMinutes + i * step
    if (end > maxEnd) break
    const totalMin = i * step
    options.push({
      endMinutes: end,
      label: `${formatTime12h(end)} (${formatDuration(totalMin)})`,
    })
  }

  return options
}
