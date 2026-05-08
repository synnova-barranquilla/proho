import type { Id } from '../../../convex/_generated/dataModel'
import {
  DAY_KEYS,
  type DayKey,
  type WeekdayAvailability,
} from '../../../convex/socialZones/validators'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvailabilitySegment = {
  startMinutes: number
  endMinutes: number
  type: 'available' | 'occupied' | 'blocked'
  reason?: string
}

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

export interface DateBlockForAvailability {
  zoneId?: Id<'socialZones'>
  date: string
  reason?: string
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
// Availability segments
// ---------------------------------------------------------------------------

export function computeAvailabilitySegments(
  zone: ZoneForAvailability,
  dayKey: DayKey,
  bookings: BookingForAvailability[],
  dateBlocks: DateBlockForAvailability[],
): AvailabilitySegment[] {
  const avail = zone.weekdayAvailability[dayKey]
  if (!avail) return []

  const fullBlock = dateBlocks.find((b) => !b.zoneId)
  const zoneBlock = dateBlocks.find((b) => b.zoneId === (zone._id as string))

  if (fullBlock || zoneBlock) {
    const block = fullBlock ?? zoneBlock
    return [
      {
        startMinutes: avail.start,
        endMinutes: avail.end,
        type: 'blocked',
        reason: block?.reason,
      },
    ]
  }

  const zoneBookings = bookings
    .filter((b) => b.zoneId === (zone._id as string))
    .sort((a, b) => a.startMinutes - b.startMinutes)

  const segments: AvailabilitySegment[] = []
  let cursor = avail.start

  for (const booking of zoneBookings) {
    if (booking.startMinutes > cursor) {
      const gapMinutes = booking.startMinutes - cursor
      if (gapMinutes >= zone.blockDurationMinutes) {
        segments.push({
          startMinutes: cursor,
          endMinutes: booking.startMinutes,
          type: 'available',
        })
      } else {
        // Gap too small — merge into the occupied segment
      }
    }
    segments.push({
      startMinutes: booking.startMinutes,
      endMinutes: booking.endMinutes,
      type: 'occupied',
    })
    cursor = Math.max(cursor, booking.endMinutes)
  }

  if (cursor < avail.end) {
    const gapMinutes = avail.end - cursor
    if (gapMinutes >= zone.blockDurationMinutes) {
      segments.push({
        startMinutes: cursor,
        endMinutes: avail.end,
        type: 'available',
      })
    }
  }

  if (segments.length === 0) {
    segments.push({
      startMinutes: avail.start,
      endMinutes: avail.end,
      type: 'available',
    })
  }

  return mergeContiguousSegments(segments)
}

function mergeContiguousSegments(
  segments: AvailabilitySegment[],
): AvailabilitySegment[] {
  if (segments.length <= 1) return segments

  const merged: AvailabilitySegment[] = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = segments[i]

    if (prev.type === curr.type && prev.endMinutes === curr.startMinutes) {
      prev.endMinutes = curr.endMinutes
    } else {
      merged.push(curr)
    }
  }

  return merged
}

// ---------------------------------------------------------------------------
// End-time options for "Hasta" selector
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
