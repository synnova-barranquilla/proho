import { useMemo } from 'react'

import { cn } from '#/lib/utils'
import { ZONE_COLORS } from '../../../convex/socialZones/validators'

interface MonthCalendarProps {
  currentMonth: Date
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onClearSelection: () => void
  monthSummary: Record<string, string[]>
  zones: Array<{ _id: string; colorIndex: number }>
  today: string
}

interface CalendarCell {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
}

const WEEKDAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const ROW_HEIGHT_PX = 48 // min-h-12 = 48px

/** Map border-{color}-500 → bg-{color}-500 */
function dotBgClass(colorIndex: number): string {
  return ZONE_COLORS[colorIndex % ZONE_COLORS.length].dot
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns 0=Mon … 6=Sun from a JS Date */
function mondayBasedDay(d: Date): number {
  return (d.getDay() + 6) % 7
}

function buildGrid(month: Date): CalendarCell[] {
  const year = month.getFullYear()
  const mon = month.getMonth()

  const firstOfMonth = new Date(year, mon, 1)
  const startOffset = mondayBasedDay(firstOfMonth) // days to pad from prev month

  const cells: CalendarCell[] = []

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, mon, -i)
    cells.push({
      date: toIso(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    })
  }

  // Current month days
  const daysInMonth = new Date(year, mon + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, mon, day)
    cells.push({ date: toIso(d), dayNumber: day, isCurrentMonth: true })
  }

  // Fill to 42 cells (6 rows)
  while (cells.length < 42) {
    const d = new Date(
      year,
      mon + 1,
      cells.length - startOffset - daysInMonth + 1,
    )
    cells.push({
      date: toIso(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    })
  }

  return cells
}

function getSelectedRow(
  cells: CalendarCell[],
  selectedDate: string | null,
): number | null {
  if (!selectedDate) return null
  const idx = cells.findIndex((c) => c.date === selectedDate)
  if (idx === -1) return null
  return Math.floor(idx / 7)
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function MonthCalendar({
  currentMonth,
  selectedDate,
  onSelectDate,
  onClearSelection,
  monthSummary,
  zones,
  today,
}: MonthCalendarProps) {
  const cells = useMemo(() => buildGrid(currentMonth), [currentMonth])
  const selectedRow = useMemo(
    () => getSelectedRow(cells, selectedDate),
    [cells, selectedDate],
  )

  const isCollapsed = selectedDate !== null && selectedRow !== null

  // Build a quick lookup: zoneId → colorIndex
  const zoneColorMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const z of zones) {
      m.set(z._id, z.colorIndex)
    }
    return m
  }, [zones])

  const monthLabel = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`

  // For the collapse animation we use max-height + negative margin-top
  // Total grid height: 6 rows * ROW_HEIGHT_PX
  const totalGridHeight = 6 * ROW_HEIGHT_PX
  const collapsedMaxHeight = ROW_HEIGHT_PX
  const rowOffset = selectedRow !== null ? selectedRow * ROW_HEIGHT_PX : 0

  return (
    <div className="w-full select-none">
      {/* Header */}
      <button
        type="button"
        onClick={isCollapsed ? onClearSelection : undefined}
        className={cn(
          'mb-2 w-full text-center text-sm font-semibold',
          isCollapsed &&
            'cursor-pointer text-primary underline-offset-2 hover:underline',
        )}
      >
        {monthLabel}
      </button>

      {/* Weekday header row */}
      <div className="grid grid-cols-7">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div
            key={i}
            className="py-1 text-center text-xs text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Month grid with collapse animation */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isCollapsed ? collapsedMaxHeight : totalGridHeight,
        }}
      >
        <div
          className="grid grid-cols-7 transition-all duration-300 ease-in-out"
          style={{
            marginTop: isCollapsed ? -rowOffset : 0,
          }}
        >
          {cells.map((cell) => {
            const isToday = cell.date === today
            const isSelected = cell.date === selectedDate
            const isPast = cell.date < today
            const zoneIds = monthSummary[cell.date] ?? []
            const hasDots = zoneIds.length > 0

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center gap-0.5',
                  !cell.isCurrentMonth && 'text-muted-foreground/40',
                  cell.isCurrentMonth &&
                    isPast &&
                    !isSelected &&
                    'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center text-sm',
                    isToday &&
                      !isSelected &&
                      'rounded-full ring-2 ring-primary',
                    isSelected &&
                      'rounded-full bg-primary text-primary-foreground',
                  )}
                >
                  {cell.dayNumber}
                </span>

                {/* Color dots */}
                {hasDots && (
                  <div className="flex gap-0.5">
                    {(zoneIds.length <= 4 ? zoneIds : zoneIds.slice(0, 3)).map(
                      (zoneId) => {
                        const colorIdx = zoneColorMap.get(zoneId)
                        return (
                          <span
                            key={zoneId}
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              colorIdx !== undefined
                                ? dotBgClass(colorIdx)
                                : 'bg-muted-foreground',
                            )}
                          />
                        )
                      },
                    )}
                    {zoneIds.length > 4 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
