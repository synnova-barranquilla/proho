import { useCallback, useMemo, useRef } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'

import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  DAY_KEYS,
  ZONE_COLORS,
  type DayKey,
  type WeekdayAvailability,
} from '../../../convex/socialZones/validators'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DayDetailProps {
  date: string // ISO date "2026-05-15"
  complexId: Id<'complexes'>
  zones: Array<{
    _id: Id<'socialZones'>
    name: string
    colorIndex: number
    weekdayAvailability: WeekdayAvailability
    blockDurationMinutes: number
  }>
  currentResidentId?: Id<'residents'>
  isAdmin: boolean
  onSlotClick: (
    date: string,
    startMinutes: number,
    zoneId?: Id<'socialZones'>,
  ) => void
  onBookingClick: (bookingId: Id<'socialZoneBookings'>) => void
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 48 // h-12 = 48px for mobile touch targets
const MINUTES_PER_ROW = 30

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${m.toString().padStart(2, '0')}`
}

function isoToDayKey(iso: string): DayKey {
  return DAY_KEYS[new Date(iso + 'T00:00:00').getDay()]
}

/**
 * Compute the earliest start and latest end across all zones for the given
 * day of week, considering per-day availability.
 */
function computeDayTimeRange(
  zones: DayDetailProps['zones'],
  dayKey: DayKey,
): [number, number] {
  let earliest = Infinity
  let latest = -Infinity

  for (const zone of zones) {
    const slot = zone.weekdayAvailability[dayKey]
    if (slot) {
      earliest = Math.min(earliest, slot.start)
      latest = Math.max(latest, slot.end)
    }
  }

  if (earliest === Infinity) {
    return [420, 1320] // fallback 7:00-22:00
  }

  return [earliest, latest]
}

/**
 * Given bookings in a single day, compute horizontal positions so
 * overlapping bookings share column width (like Google Calendar).
 */
function layoutOverlappingBookings(
  dayBookings: Booking[],
): Map<string, { leftFrac: number; widthFrac: number }> {
  const result = new Map<string, { leftFrac: number; widthFrac: number }>()
  if (dayBookings.length === 0) return result

  const sorted = [...dayBookings].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes,
  )

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

export function DayDetail({
  date,
  complexId,
  zones,
  currentResidentId,
  isAdmin,
  onSlotClick,
  onBookingClick,
}: DayDetailProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Fetch bookings and blocks for this day
  const { data: bookings } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getWeekBookings, {
      complexId,
      weekDates: [date],
    }),
  )

  const { data: dateBlocks } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getDateBlocks, {
      complexId,
      weekDates: [date],
    }),
  )

  const dayKey = useMemo(() => isoToDayKey(date), [date])

  // Filter zones to only those available on this day of week
  const availableZones = useMemo(
    () => zones.filter((z) => z.weekdayAvailability[dayKey] !== null),
    [zones, dayKey],
  )

  const [rangeStart, rangeEnd] = useMemo(
    () => computeDayTimeRange(availableZones, dayKey),
    [availableZones, dayKey],
  )

  // Generate time row labels (every 30 min)
  const timeSlots = useMemo(() => {
    const slots: number[] = []
    for (let m = rangeStart; m < rangeEnd; m += MINUTES_PER_ROW) {
      slots.push(m)
    }
    return slots
  }, [rangeStart, rangeEnd])

  // Zone lookup
  const zoneMap = useMemo(
    () => new Map(availableZones.map((z) => [z._id as string, z])),
    [availableZones],
  )

  // Cast bookings to local Booking type
  const typedBookings = bookings as Booking[]
  const typedBlocks = dateBlocks as DateBlock[]

  // Layout overlapping bookings
  const layout = useMemo(
    () => layoutOverlappingBookings(typedBookings),
    [typedBookings],
  )

  // Check for full-date block (no zoneId = all zones blocked)
  const fullBlock = useMemo(
    () => typedBlocks.find((b) => !b.zoneId),
    [typedBlocks],
  )

  // Zone-specific blocks
  const zoneBlocks = useMemo(
    () => typedBlocks.filter((b) => b.zoneId),
    [typedBlocks],
  )

  const totalHeight = timeSlots.length * ROW_HEIGHT

  // Handle click on empty grid area to determine which time slot was tapped
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle clicks directly on the grid, not on booking buttons
      if (e.target !== e.currentTarget) return

      const rect = e.currentTarget.getBoundingClientRect()
      const relativeY = e.clientY - rect.top
      const slotIndex = Math.floor(relativeY / ROW_HEIGHT)
      const startMinutes = rangeStart + slotIndex * MINUTES_PER_ROW

      if (startMinutes >= rangeStart && startMinutes < rangeEnd) {
        onSlotClick(date, startMinutes)
      }
    },
    [date, rangeStart, rangeEnd, onSlotClick],
  )

  if (availableZones.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No hay zonas disponibles este dia
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto rounded-lg border">
      <div className="relative flex">
        {/* Left gutter — time labels */}
        <div
          className="relative w-12 shrink-0 border-r bg-background"
          style={{ height: totalHeight }}
        >
          {timeSlots.map((minutes, idx) => (
            <div
              key={minutes}
              className="absolute right-1 text-[11px] leading-none text-muted-foreground"
              style={{ top: idx * ROW_HEIGHT - 6 }}
            >
              {idx === 0 ? '' : formatTime(minutes)}
            </div>
          ))}
        </div>

        {/* Main column — booking grid */}
        <div
          ref={gridRef}
          className="relative min-w-0 flex-1"
          style={{ height: totalHeight }}
          onClick={handleGridClick}
        >
          {/* Grid lines */}
          {timeSlots.map((minutes, idx) => (
            <div
              key={minutes}
              className="absolute inset-x-0 border-b border-muted"
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

          {/* Zone-specific block overlays */}
          {zoneBlocks.map((block, i) => {
            const zone = block.zoneId ? zoneMap.get(block.zoneId) : undefined
            if (!zone) return null

            const slot = zone.weekdayAvailability[dayKey]
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
          {typedBookings.map((booking) => {
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
              ((booking.endMinutes - booking.startMinutes) / MINUTES_PER_ROW) *
              ROW_HEIGHT

            return (
              <button
                key={booking._id}
                type="button"
                className={cn(
                  'absolute z-20 overflow-hidden rounded border px-2 py-1 text-left text-xs leading-tight transition-opacity hover:opacity-80',
                  color.border,
                  color.text,
                  color.darkText,
                  isOwn ? color.bg : `${color.bg} opacity-60`,
                )}
                style={{
                  top: topPx,
                  height: Math.max(heightPx, 24),
                  left: `${pos.leftFrac * 100}%`,
                  width: `${pos.widthFrac * 100}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onBookingClick(booking._id)
                }}
                aria-label={
                  canSeeDetails
                    ? `${zone?.name ?? 'Zona'} ${formatTime(booking.startMinutes)}-${formatTime(booking.endMinutes)}`
                    : 'Ocupado'
                }
              >
                {canSeeDetails ? (
                  <>
                    <div className="truncate font-medium">
                      {zone?.name ?? 'Zona'}
                    </div>
                    {heightPx >= 36 && (
                      <div className="truncate text-[10px] opacity-80">
                        {formatTime(booking.startMinutes)}-
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
      </div>
    </div>
  )
}
