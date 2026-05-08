import { DAY_KEYS, type DayKey, type WeekdayAvailability } from './validators'

export type AvailabilitySegment = {
  startMinutes: number
  endMinutes: number
  type: 'available' | 'occupied' | 'blocked'
  reason?: string
}

interface ZoneInput {
  _id: string
  blockDurationMinutes: number
  weekdayAvailability: WeekdayAvailability
}

interface BookingInput {
  zoneId: string
  startMinutes: number
  endMinutes: number
}

interface DateBlockInput {
  zoneId?: string
  reason?: string
}

export function isoToDayKey(iso: string): DayKey {
  return DAY_KEYS[new Date(iso + 'T00:00:00').getDay()]
}

export function computeAvailabilitySegments(
  zone: ZoneInput,
  dayKey: DayKey,
  bookings: BookingInput[],
  dateBlocks: DateBlockInput[],
): AvailabilitySegment[] {
  const avail = zone.weekdayAvailability[dayKey]
  if (!avail) return []

  const fullBlock = dateBlocks.find((b) => !b.zoneId)
  const zoneBlock = dateBlocks.find((b) => b.zoneId === zone._id)

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
    .filter((b) => b.zoneId === zone._id)
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
