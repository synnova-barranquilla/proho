import { useMemo } from 'react'

import { cn } from '#/lib/utils'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  DAY_KEYS,
  DAY_LABELS,
  ZONE_COLORS,
  type DayKey,
  type WeekdayAvailability,
} from '../../../convex/socialZones/validators'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Zone {
  _id: Id<'socialZones'>
  name: string
  colorIndex: number
  weekdayAvailability: WeekdayAvailability
  blockDurationMinutes: number
}

interface Booking {
  _id: Id<'socialZoneBookings'>
  zoneId: Id<'socialZones'>
  date: string
  startMinutes: number
  endMinutes: number
  residentId: Id<'residents'>
}

interface DateBlock {
  zoneId?: Id<'socialZones'>
  date: string
  reason?: string
}

export interface WeekCalendarProps {
  zones: Zone[]
  bookings: Booking[]
  dateBlocks: DateBlock[]
  weekDates: string[]
  currentResidentId?: Id<'residents'>
  isAdmin: boolean
  onSlotClick: (
    date: string,
    startMinutes: number,
    zoneId?: Id<'socialZones'>,
  ) => void
  onBookingClick: (bookingId: Id<'socialZoneBookings'>) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = DAY_KEYS.map((k) => DAY_LABELS[k])
const ROW_HEIGHT = 40 // h-10 = 40px
const MINUTES_PER_ROW = 30

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

function isoToDayKey(iso: string): DayKey {
  return DAY_KEYS[new Date(iso + 'T00:00:00').getDay()]
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Compute the earliest start and latest end across all zones for the given
 * week, considering per-day availability. Returns [startMinutes, endMinutes].
 */
function computeTimeRange(
  zones: Zone[],
  weekDates: string[],
): [number, number] {
  let earliest = Infinity
  let latest = -Infinity

  for (const date of weekDates) {
    const dow = isoToDayKey(date)
    for (const zone of zones) {
      const slot = zone.weekdayAvailability[dow]
      if (slot) {
        earliest = Math.min(earliest, slot.start)
        latest = Math.max(latest, slot.end)
      }
    }
  }

  if (earliest === Infinity) {
    // No availability at all — fallback
    return [420, 1320]
  }

  return [earliest, latest]
}

/**
 * Given bookings in a single day-column, compute horizontal positions so
 * overlapping bookings share column width (like Google Calendar).
 * Returns a map from booking _id to { left fraction [0-1), width fraction }.
 */
function layoutOverlappingBookings(
  dayBookings: Booking[],
): Map<string, { leftFrac: number; widthFrac: number }> {
  const result = new Map<string, { leftFrac: number; widthFrac: number }>()
  if (dayBookings.length === 0) return result

  // Sort by start time, then by end time descending (longer events first)
  const sorted = [...dayBookings].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes,
  )

  // Greedy column assignment
  const columns: Booking[][] = []

  for (const booking of sorted) {
    let placed = false
    for (const col of columns) {
      const last = col[col.length - 1]
      if (last.endMinutes <= booking.startMinutes) {
        col.push(booking)
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([booking])
    }
  }

  const totalCols = columns.length
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (const booking of columns[colIdx]) {
      result.set(booking._id, {
        leftFrac: colIdx / totalCols,
        widthFrac: 1 / totalCols,
      })
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeekCalendar({
  zones,
  bookings,
  dateBlocks,
  weekDates,
  currentResidentId,
  isAdmin,
  onSlotClick,
  onBookingClick,
}: WeekCalendarProps) {
  const today = todayIso()

  const [rangeStart, rangeEnd] = useMemo(
    () => computeTimeRange(zones, weekDates),
    [zones, weekDates],
  )

  // Generate time row labels (every 30 min)
  const timeSlots = useMemo(() => {
    const slots: number[] = []
    for (let m = rangeStart; m < rangeEnd; m += MINUTES_PER_ROW) {
      slots.push(m)
    }
    return slots
  }, [rangeStart, rangeEnd])

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      const arr = map.get(b.date) ?? []
      arr.push(b)
      map.set(b.date, arr)
    }
    return map
  }, [bookings])

  // Group date blocks by date
  const blocksByDate = useMemo(() => {
    const map = new Map<string, DateBlock[]>()
    for (const b of dateBlocks) {
      const arr = map.get(b.date) ?? []
      arr.push(b)
      map.set(b.date, arr)
    }
    return map
  }, [dateBlocks])

  // Zone lookup
  const zoneMap = useMemo(
    () => new Map(zones.map((z) => [z._id as string, z])),
    [zones],
  )

  const totalHeight = timeSlots.length * ROW_HEIGHT

  // Check if a date is fully blocked (block with no zoneId = all zones blocked)
  function isDateFullyBlocked(date: string): DateBlock | undefined {
    const blocks = blocksByDate.get(date) ?? []
    return blocks.find((b) => !b.zoneId)
  }

  return (
    <div className="overflow-auto rounded-lg border">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `56px repeat(7, minmax(100px, 1fr))`,
        }}
      >
        {/* Header row — corner */}
        <div className="sticky top-0 z-20 border-b border-r bg-background" />

        {/* Header row — day columns */}
        {weekDates.map((date) => {
          const d = new Date(date + 'T00:00:00')
          const dayName = DAY_NAMES[d.getDay()]
          const dayNum = d.getDate()
          const isToday = date === today

          return (
            <div
              key={date}
              className={cn(
                'sticky top-0 z-20 border-b border-r bg-background px-2 py-2 text-center',
                isToday && 'bg-primary/5',
              )}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {dayName}
              </div>
              <div
                className={cn(
                  'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                  isToday && 'bg-primary text-primary-foreground',
                )}
              >
                {dayNum}
              </div>
            </div>
          )
        })}

        {/* Time gutter */}
        <div className="relative border-r" style={{ height: totalHeight }}>
          {timeSlots.map((minutes, idx) => (
            <div
              key={minutes}
              className="absolute right-2 text-[11px] leading-none text-muted-foreground"
              style={{ top: idx * ROW_HEIGHT - 6 }}
            >
              {idx === 0 ? '' : formatTime(minutes)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDates.map((date) => {
          const isToday = date === today
          const dayBookings = bookingsByDate.get(date) ?? []
          const layout = layoutOverlappingBookings(dayBookings)
          const fullBlock = isDateFullyBlocked(date)

          return (
            <div
              key={date}
              className={cn(
                'relative border-r',
                isToday && 'bg-primary/[0.03]',
              )}
              style={{ height: totalHeight }}
            >
              {/* Grid lines */}
              {timeSlots.map((minutes, idx) => (
                <div
                  key={minutes}
                  className="absolute inset-x-0 border-b border-border/50"
                  style={{ top: idx * ROW_HEIGHT }}
                />
              ))}

              {/* Clickable time slots */}
              {timeSlots.map((minutes, idx) => (
                <button
                  key={`slot-${minutes}`}
                  type="button"
                  className="absolute inset-x-0 cursor-pointer hover:bg-accent/30"
                  style={{
                    top: idx * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                  }}
                  onClick={() => onSlotClick(date, minutes)}
                  aria-label={`Reservar ${formatTime(minutes)} el ${date}`}
                />
              ))}

              {/* Full-date block overlay */}
              {fullBlock && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{
                    background:
                      'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 8px)',
                  }}
                >
                  {fullBlock.reason && (
                    <span className="rounded bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground">
                      {fullBlock.reason}
                    </span>
                  )}
                </div>
              )}

              {/* Zone-specific blocks */}
              {(blocksByDate.get(date) ?? [])
                .filter((b) => b.zoneId)
                .map((block, i) => {
                  const zone = block.zoneId
                    ? zoneMap.get(block.zoneId)
                    : undefined
                  if (!zone) return null
                  // Zone-specific block covers the zone's availability for this day
                  const dow = isoToDayKey(date)
                  const slot = zone.weekdayAvailability[dow]
                  if (!slot) return null

                  const topPx =
                    ((slot.start - rangeStart) / MINUTES_PER_ROW) * ROW_HEIGHT
                  const heightPx =
                    ((slot.end - slot.start) / MINUTES_PER_ROW) * ROW_HEIGHT

                  return (
                    <div
                      key={`block-${block.zoneId}-${i}`}
                      className="absolute inset-x-0 z-10 flex items-center justify-center"
                      style={{
                        top: topPx,
                        height: heightPx,
                        background:
                          'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 8px)',
                      }}
                    >
                      {block.reason && (
                        <span className="rounded bg-background/80 px-1 py-0.5 text-[10px] text-muted-foreground">
                          {block.reason}
                        </span>
                      )}
                    </div>
                  )
                })}

              {/* Booking blocks */}
              {dayBookings.map((booking) => {
                const pos = layout.get(booking._id)
                if (!pos) return null

                const zone = zoneMap.get(booking.zoneId)
                const color =
                  ZONE_COLORS[(zone?.colorIndex ?? 0) % ZONE_COLORS.length]

                const isOwn = booking.residentId === currentResidentId
                const canSeeDetails = isOwn || isAdmin

                const topPx =
                  ((booking.startMinutes - rangeStart) / MINUTES_PER_ROW) *
                  ROW_HEIGHT
                const heightPx =
                  ((booking.endMinutes - booking.startMinutes) /
                    MINUTES_PER_ROW) *
                  ROW_HEIGHT

                return (
                  <button
                    key={booking._id}
                    type="button"
                    className={cn(
                      'absolute z-10 overflow-hidden rounded border px-1 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-80',
                      color.border,
                      color.text,
                      color.darkText,
                      isOwn ? color.bg : `${color.bg} opacity-60`,
                    )}
                    style={{
                      top: topPx,
                      height: Math.max(heightPx, 20),
                      left: `${pos.leftFrac * 100}%`,
                      width: `${pos.widthFrac * 100}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onBookingClick(booking._id)
                    }}
                    aria-label={
                      canSeeDetails
                        ? `${zone?.name ?? 'Zona'} ${formatTime(booking.startMinutes)}–${formatTime(booking.endMinutes)}`
                        : 'Ocupado'
                    }
                  >
                    {canSeeDetails ? (
                      <>
                        <div className="truncate font-medium">
                          {zone?.name ?? 'Zona'}
                        </div>
                        {heightPx >= 32 && (
                          <div className="truncate text-[10px] opacity-80">
                            {formatTime(booking.startMinutes)}–
                            {formatTime(booking.endMinutes)}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="truncate font-medium">Ocupado</div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
