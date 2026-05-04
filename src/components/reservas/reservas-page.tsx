import { useMemo, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Settings } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useIsComplexAdmin } from '#/lib/complex-role'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  MAX_BOOKING_HORIZON_WEEKS,
  ZONE_COLORS,
} from '../../../convex/socialZones/validators'
import { WeekCalendar } from './week-calendar'

const complexRoute = getRouteApi('/_authenticated/c/$complexSlug')

/** Monday-based week start for a given offset from today's week. */
function getWeekStartDate(weekOffset: number): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day // distance to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Returns 7 ISO-date strings (YYYY-MM-DD) starting from `monday`. */
function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

/** Formats a date range like "Lun 5 May – Dom 11 May" */
function formatWeekRange(weekDates: string[]): string {
  const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const MONTH_NAMES = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]

  const fmt = (iso: string) => {
    const d = new Date(iso + 'T00:00:00')
    const dayName = DAY_NAMES[d.getDay()]
    const date = d.getDate()
    const month = MONTH_NAMES[d.getMonth()]
    return `${dayName} ${date} ${month}`
  }

  return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`
}

interface ReservasPageProps {
  complexId: Id<'complexes'>
}

export function ReservasPage({ complexId }: ReservasPageProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [_showZoneManagement, setShowZoneManagement] = useState(false)
  const [_showMyBookings, setShowMyBookings] = useState(false)

  const isAdmin = useIsComplexAdmin()
  const { complexSlug: slug } = complexRoute.useParams()

  const weekStart = useMemo(() => getWeekStartDate(weekOffset), [weekOffset])
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])

  // Fetch complex data to get membership → residentId
  const { data: complexData } = useSuspenseQuery(
    convexQuery(api.complexes.queries.getBySlug, { slug }),
  )

  const { data: zones } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.listByComplex, { complexId }),
  )

  const { data: bookings } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getWeekBookings, {
      complexId,
      weekDates,
    }),
  )

  const { data: dateBlocks } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getDateBlocks, {
      complexId,
      weekDates,
    }),
  )

  const currentResidentId = complexData?.membership?.residentId ?? undefined

  const handleSlotClick = (
    _date: string,
    _startMinutes: number,
    _zoneId?: Id<'socialZones'>,
  ) => {
    // TODO: open booking creation sheet
  }

  const handleBookingClick = (_bookingId: Id<'socialZoneBookings'>) => {
    // TODO: open booking detail sheet
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Week navigation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={weekOffset <= 0}
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset(0)}
          >
            Hoy
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={weekOffset >= MAX_BOOKING_HORIZON_WEEKS}
            onClick={() =>
              setWeekOffset((o) => Math.min(MAX_BOOKING_HORIZON_WEEKS, o + 1))
            }
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="ml-2 text-sm font-medium text-muted-foreground">
            {formatWeekRange(weekDates)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMyBookings(true)}
          >
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Mis Reservas
          </Button>

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowZoneManagement(true)}
              aria-label="Administrar zonas"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Zone legend bar */}
      {zones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {zones.map((zone) => {
            const color = ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length]
            return (
              <span
                key={zone._id}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  color.bg,
                  color.border,
                  color.text,
                  color.darkText,
                )}
              >
                {zone.name}
              </span>
            )
          })}
        </div>
      )}

      {/* Weekly calendar grid */}
      <WeekCalendar
        zones={zones}
        bookings={bookings}
        dateBlocks={dateBlocks}
        weekDates={weekDates}
        currentResidentId={currentResidentId}
        isAdmin={isAdmin}
        onSlotClick={handleSlotClick}
        onBookingClick={handleBookingClick}
      />
    </div>
  )
}
