import { useMemo } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { Button } from '#/components/ui/button'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { AvailabilitySegment } from '../../../convex/socialZones/availability'
import { DAY_KEYS, ZONE_COLORS } from '../../../convex/socialZones/validators'
import {
  formatTime12h,
  type BookingForAvailability,
} from './availability-utils'

interface ZoneAvailabilityProps {
  date: string
  complexId: Id<'complexes'>
  onReservar: (
    date: string,
    startMinutes: number,
    zoneId: Id<'socialZones'>,
    blockStart: number,
    blockEnd: number,
    bookings: BookingForAvailability[],
  ) => void
}

export function ZoneAvailability({
  date,
  complexId,
  onReservar,
}: ZoneAvailabilityProps) {
  const { data } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getDayAvailability, {
      complexId,
      date,
    }),
  )

  const { data: bookings } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getWeekBookings, {
      complexId,
      weekDates: [date],
    }),
  )

  const dayKey = DAY_KEYS[new Date(date + 'T00:00:00').getDay()]

  const availableZoneIds = useMemo(
    () =>
      data
        .filter((d) => d.zone.weekdayAvailability[dayKey] !== null)
        .map((d) => d.zone._id),
    [data, dayKey],
  )

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No hay zonas disponibles
      </div>
    )
  }

  return (
    <Accordion key={date} defaultValue={availableZoneIds.slice(0, 1)}>
      {data.map(({ zone, segments }) => {
        const isClosed = zone.weekdayAvailability[dayKey] === null
        const color = ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length]

        return (
          <AccordionItem key={zone._id} value={zone._id} disabled={isClosed}>
            <AccordionTrigger className="px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block size-2.5 rounded-full ${color.dot}`}
                />
                <span>{zone.name}</span>
                {isClosed && (
                  <span className="text-xs text-muted-foreground">
                    · Cerrado
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1.5 px-1">
                {segments.map((segment) => (
                  <SegmentCard
                    key={`${zone._id}-${segment.type}-${segment.startMinutes}`}
                    segment={segment}
                    onReservar={() =>
                      onReservar(
                        date,
                        segment.startMinutes,
                        zone._id,
                        segment.startMinutes,
                        segment.endMinutes,
                        bookings as BookingForAvailability[],
                      )
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

function SegmentCard({
  segment,
  onReservar,
}: {
  segment: AvailabilitySegment
  onReservar: () => void
}) {
  if (segment.type === 'available') {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
        <span>
          {formatTime12h(segment.startMinutes)} –{' '}
          {formatTime12h(segment.endMinutes)} · Disponible
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-green-700 hover:bg-green-100 hover:text-green-800 dark:text-green-300 dark:hover:bg-green-900 dark:hover:text-green-200"
          onClick={onReservar}
        >
          Reservar
        </Button>
      </div>
    )
  }

  if (segment.type === 'blocked') {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <span>Todo el día · Bloqueado</span>
        {segment.reason && (
          <span className="ml-1 text-amber-600 dark:text-amber-400">
            — {segment.reason}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
      {formatTime12h(segment.startMinutes)} –{' '}
      {formatTime12h(segment.endMinutes)} · Ocupado
    </div>
  )
}
