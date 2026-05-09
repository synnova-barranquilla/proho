import { Suspense, useMemo, useState, useTransition } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useIsComplexAdmin } from '#/lib/complex-role'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ZONE_COLORS } from '../../../convex/socialZones/validators'
import type { BookingForAvailability } from './availability-utils'
import { BookingDialog } from './booking-dialog'
import { MonthCalendar } from './month-calendar'
import { MyBookingsSheet } from './my-bookings-sheet'
import { ZoneAvailability } from './zone-availability'

const complexRoute = getRouteApi('/_authenticated/c/$complexSlug')

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

function getMonthDates(month: Date): string[] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, m, i + 1)
    return d.toISOString().slice(0, 10)
  })
}

function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

interface ReservasPageProps {
  complexId: Id<'complexes'>
}

export function ReservasPage({ complexId }: ReservasPageProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    getFirstOfMonth(now),
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    now.toISOString().slice(0, 10),
  )
  const [isPending, startTransition] = useTransition()
  const [showMyBookings, setShowMyBookings] = useState(false)
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean
    date?: string
    startMinutes?: number
    zoneId?: Id<'socialZones'>
    blockStart?: number
    blockEnd?: number
    bookings?: BookingForAvailability[]
  }>({ open: false })

  const isAdmin = useIsComplexAdmin()
  const { complexSlug: slug } = complexRoute.useParams()

  const monthDates = useMemo(() => getMonthDates(currentMonth), [currentMonth])

  const currentMonthStart = getFirstOfMonth(now)
  const maxMonth = new Date(
    currentMonthStart.getFullYear(),
    currentMonthStart.getMonth() + 1,
    1,
  )

  const isPrevDisabled =
    currentMonth.getFullYear() === currentMonthStart.getFullYear() &&
    currentMonth.getMonth() === currentMonthStart.getMonth()
  const isNextDisabled =
    currentMonth.getFullYear() === maxMonth.getFullYear() &&
    currentMonth.getMonth() === maxMonth.getMonth()

  const handlePrevMonth = () => {
    if (isPrevDisabled) return
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    )
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    if (isNextDisabled) return
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    )
    setSelectedDate(null)
  }

  const handleToday = () => {
    setCurrentMonth(getFirstOfMonth(now))
    setSelectedDate(null)
  }

  const { data: complexData } = useSuspenseQuery(
    convexQuery(api.complexes.queries.getBySlug, { slug }),
  )

  const { data: zones } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.listByComplex, { complexId }),
  )

  const { data: monthSummary } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getMonthSummary, {
      complexId,
      monthDates,
    }),
  )

  const currentResidentId = complexData?.membership?.residentId ?? undefined

  const handleReservar = (
    date: string,
    startMinutes: number,
    zoneId: Id<'socialZones'>,
    blockStart: number,
    blockEnd: number,
    bookings: BookingForAvailability[],
  ) => {
    setBookingDialog({
      open: true,
      date,
      startMinutes,
      zoneId,
      blockStart,
      blockEnd,
      bookings,
    })
  }

  const selectedZone = zones.find((z) => z._id === bookingDialog.zoneId)

  const monthLabel = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={isPrevDisabled}
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-lg font-semibold">{monthLabel}</span>

          <Button
            variant="outline"
            size="icon"
            disabled={isNextDisabled}
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPrevDisabled}
            onClick={handleToday}
          >
            Hoy
          </Button>

          {currentResidentId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMyBookings(true)}
            >
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Mis Reservas
            </Button>
          )}
        </div>
      </div>

      {/* Zone legend */}
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => {
            const color = ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length]
            return (
              <span
                key={zone._id}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className={cn('h-2 w-2 rounded-full', color.dot)} />
                {zone.name}
              </span>
            )
          })}
        </div>
      )}

      {/* Month calendar grid */}
      <MonthCalendar
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={(date) => startTransition(() => setSelectedDate(date))}
        onClearSelection={() => startTransition(() => setSelectedDate(null))}
        monthSummary={monthSummary}
        zones={zones}
        today={now.toISOString().slice(0, 10)}
      />

      {/* Zone availability accordion */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div className="h-full w-full origin-left animate-[nav-progress_1.5s_ease-out_forwards] bg-primary" />
          </div>
        )}
      </div>
      {selectedDate && (
        <Suspense>
          <ZoneAvailability
            date={selectedDate}
            complexId={complexId}
            onReservar={handleReservar}
          />
        </Suspense>
      )}

      <BookingDialog
        open={bookingDialog.open}
        onOpenChange={(open) => setBookingDialog((prev) => ({ ...prev, open }))}
        complexId={complexId}
        zone={selectedZone}
        initialDate={bookingDialog.date}
        initialStartMinutes={bookingDialog.startMinutes}
        availableBlockStart={bookingDialog.blockStart}
        availableBlockEnd={bookingDialog.blockEnd}
        bookings={bookingDialog.bookings ?? []}
        residentId={currentResidentId}
        isAdmin={isAdmin}
      />

      {currentResidentId && (
        <MyBookingsSheet
          open={showMyBookings}
          onOpenChange={setShowMyBookings}
          complexId={complexId}
          residentId={currentResidentId}
        />
      )}
    </div>
  )
}
