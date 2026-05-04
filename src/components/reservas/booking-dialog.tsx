import { useMemo, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ZONE_COLORS } from '../../../convex/socialZones/validators'

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  zones: Array<{
    _id: Id<'socialZones'>
    name: string
    colorIndex: number
    blockDurationMinutes: number
    maxConsecutiveBlocks: number
    weekdayAvailability: Record<number, { start: number; end: number } | null>
  }>
  initialDate?: string
  initialStartMinutes?: number
  initialZoneId?: Id<'socialZones'>
  residentId: Id<'residents'>
  unitId: Id<'units'>
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function BookingDialog({
  open,
  onOpenChange,
  zones,
  initialDate,
  initialStartMinutes,
  initialZoneId,
  residentId,
  unitId,
}: BookingDialogProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<
    Id<'socialZones'> | undefined
  >(initialZoneId)
  const [startMinutes, setStartMinutes] = useState<number | undefined>(
    initialStartMinutes,
  )
  const [blockCount, setBlockCount] = useState(1)

  const mutationFn = useConvexMutation(api.socialZones.mutations.createBooking)
  const mutation = useMutation({ mutationFn })

  const selectedZone = zones.find((z) => z._id === selectedZoneId)

  // Compute the day-of-week from the ISO date to look up availability
  const dayOfWeek = useMemo(() => {
    if (!initialDate) return undefined
    const d = new Date(initialDate + 'T00:00:00')
    return d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
  }, [initialDate])

  // Available time slots based on zone's weekday availability
  const timeSlots = useMemo(() => {
    if (!selectedZone || dayOfWeek === undefined) return []
    const avail = selectedZone.weekdayAvailability[dayOfWeek]
    if (!avail) return []

    const slots: number[] = []
    const step = selectedZone.blockDurationMinutes
    // The last possible start is (end - one block duration)
    for (let m = avail.start; m <= avail.end - step; m += step) {
      slots.push(m)
    }
    return slots
  }, [selectedZone, dayOfWeek])

  // Max blocks available from the selected start time
  const maxBlocks = useMemo(() => {
    if (!selectedZone || dayOfWeek === undefined || startMinutes === undefined)
      return 1
    const avail = selectedZone.weekdayAvailability[dayOfWeek]
    if (!avail) return 1
    const remainingMinutes = avail.end - startMinutes
    const possible = Math.floor(
      remainingMinutes / selectedZone.blockDurationMinutes,
    )
    return Math.min(possible, selectedZone.maxConsecutiveBlocks)
  }, [selectedZone, dayOfWeek, startMinutes])

  const blockOptions = Array.from({ length: maxBlocks }, (_, i) => i + 1)

  const endMinutes =
    startMinutes !== undefined && selectedZone
      ? startMinutes + blockCount * selectedZone.blockDurationMinutes
      : undefined

  const formattedDate = useMemo(() => {
    if (!initialDate) return ''
    const d = new Date(initialDate + 'T12:00:00')
    return DATE_FORMATTER.format(d)
  }, [initialDate])

  // Check if the zone is closed on the selected day
  const isClosed = useMemo(() => {
    if (!selectedZone || dayOfWeek === undefined) return false
    return selectedZone.weekdayAvailability[dayOfWeek] === null
  }, [selectedZone, dayOfWeek])

  function handleZoneChange(zoneId: Id<'socialZones'>) {
    setSelectedZoneId(zoneId)
    setStartMinutes(undefined)
    setBlockCount(1)
  }

  async function handleSubmit() {
    if (
      !selectedZoneId ||
      startMinutes === undefined ||
      !endMinutes ||
      !initialDate
    )
      return

    try {
      await mutation.mutateAsync({
        zoneId: selectedZoneId,
        residentId,
        unitId,
        date: initialDate,
        startMinutes,
        endMinutes,
      })
      toast.success('Reserva creada')
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al crear reserva')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  // Reset state when dialog opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setSelectedZoneId(initialZoneId)
      setStartMinutes(initialStartMinutes)
      setBlockCount(1)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-4">
            {/* Zone selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Zona</span>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => {
                  const color =
                    ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length]
                  const isSelected = selectedZoneId === zone._id
                  return (
                    <button
                      key={zone._id}
                      type="button"
                      onClick={() => handleZoneChange(zone._id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? `${color.bg} ${color.border} ${color.text} ${color.darkText}`
                          : 'border-input hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block size-2.5 rounded-full ${color.border} ${isSelected ? 'bg-current' : `${color.bg}`}`}
                      />
                      {zone.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date (read-only) */}
            {initialDate && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Fecha</span>
                <div className="rounded-md bg-muted px-3 py-2 text-sm capitalize">
                  {formattedDate}
                </div>
              </div>
            )}

            {/* Closed day warning */}
            {isClosed && selectedZone && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {selectedZone.name} no tiene disponibilidad este día.
              </div>
            )}

            {/* Start time selector */}
            {selectedZone && !isClosed && timeSlots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Hora de inicio</span>
                <Select
                  value={
                    startMinutes !== undefined
                      ? String(startMinutes)
                      : undefined
                  }
                  onValueChange={(val) => {
                    setStartMinutes(Number(val))
                    setBlockCount(1)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {formatMinutes(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Duration selector */}
            {selectedZone && startMinutes !== undefined && !isClosed && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Duración</span>
                <Select
                  value={String(blockCount)}
                  onValueChange={(val) => setBlockCount(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blockOptions.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? 'bloque' : 'bloques'} (
                        {n * selectedZone.blockDurationMinutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {endMinutes !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {formatMinutes(startMinutes)} &ndash;{' '}
                    {formatMinutes(endMinutes)}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !selectedZoneId ||
              startMinutes === undefined ||
              !endMinutes ||
              isClosed
            }
          >
            {mutation.isPending ? 'Reservando...' : 'Reservar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
