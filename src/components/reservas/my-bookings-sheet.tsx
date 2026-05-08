import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ZONE_COLORS } from '../../../convex/socialZones/validators'
import { formatTime12h } from './availability-utils'

interface MyBookingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  residentId: Id<'residents'>
}

const BOOKING_DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function isUpcoming(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const bookingDate = new Date(dateStr + 'T00:00:00')
  return bookingDate >= today
}

export function MyBookingsSheet({
  open,
  onOpenChange,
  complexId,
  residentId,
}: MyBookingsSheetProps) {
  const { data: bookings } = useSuspenseQuery(
    convexQuery(api.socialZones.queries.getMyBookings, {
      complexId,
      residentId,
    }),
  )

  const upcomingBookings = bookings.filter((b) => isUpcoming(b.date))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Mis reservas</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {upcomingBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tienes reservas próximas
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BookingCard({
  booking,
}: {
  booking: {
    _id: Id<'socialZoneBookings'>
    date: string
    startMinutes: number
    endMinutes: number
    zone: { name: string; colorIndex: number } | null
  }
}) {
  const mutationFn = useConvexMutation(api.socialZones.mutations.cancelBooking)
  const cancelMutation = useMutation({ mutationFn })

  const zone = booking.zone
  const color = zone ? ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length] : null

  async function handleCancel() {
    try {
      await cancelMutation.mutateAsync({
        bookingId: booking._id,
        cancelledBy: 'RESIDENT',
      })
      toast.success('Reserva cancelada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al cancelar reserva')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const formattedDate = BOOKING_DATE_FORMATTER.format(
    new Date(booking.date + 'T12:00:00'),
  )

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        {color && (
          <span
            className={`inline-block size-2.5 shrink-0 rounded-full ${color.border} bg-current ${color.text} ${color.darkText}`}
          />
        )}
        <span className="text-sm font-medium">{zone?.name ?? 'Zona'}</span>
      </div>
      <div className="text-sm capitalize text-muted-foreground">
        {formattedDate}
      </div>
      <div className="text-sm text-muted-foreground">
        {formatTime12h(booking.startMinutes)} &ndash;{' '}
        {formatTime12h(booking.endMinutes)}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start text-destructive hover:bg-destructive/10"
        disabled={cancelMutation.isPending}
        onClick={handleCancel}
      >
        {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar reserva'}
      </Button>
    </div>
  )
}
