import { useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '#/components/ui/responsive-dialog'
import { SearchableSelect } from '#/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { buildUnitOptions } from '#/lib/unit-search'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  DAY_KEYS,
  ZONE_COLORS,
  type WeekdayAvailability,
} from '../../../convex/socialZones/validators'
import {
  computeEndTimeOptions,
  endTimeValueFormatter,
  formatTime12h,
  minutesValueFormatter,
  type BookingForAvailability,
} from './availability-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  zone?: {
    _id: Id<'socialZones'>
    name: string
    colorIndex: number
    blockDurationMinutes: number
    maxConsecutiveBlocks: number
    weekdayAvailability: WeekdayAvailability
  }
  initialDate?: string
  initialStartMinutes?: number
  availableBlockStart?: number
  availableBlockEnd?: number
  bookings: BookingForAvailability[]
  residentId?: Id<'residents'>
  isAdmin: boolean
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingDialog({
  open,
  onOpenChange,
  complexId,
  zone,
  initialDate,
  initialStartMinutes,
  availableBlockStart,
  availableBlockEnd,
  bookings,
  residentId,
  isAdmin,
}: BookingDialogProps) {
  const [startMinutes, setStartMinutes] = useState<number | undefined>(
    initialStartMinutes,
  )
  const [endMinutes, setEndMinutes] = useState<number | undefined>(undefined)

  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [selectedResidentId, setSelectedResidentId] = useState<string>('')

  useEffect(() => {
    setStartMinutes(initialStartMinutes)
    setEndMinutes(undefined)
    setSelectedUnitId('')
    setSelectedResidentId('')
  }, [initialStartMinutes, availableBlockStart, availableBlockEnd, zone?._id])

  const mutationFn = useConvexMutation(api.socialZones.mutations.createBooking)
  const mutation = useMutation({ mutationFn })

  const dayKey = useMemo(() => {
    if (!initialDate) return undefined
    return DAY_KEYS[new Date(initialDate + 'T00:00:00').getDay()]
  }, [initialDate])

  const timeSlots = useMemo(() => {
    if (!zone || dayKey === undefined) return []
    const avail = zone.weekdayAvailability[dayKey]
    if (!avail) return []

    const blockStart = availableBlockStart ?? avail.start
    const blockEnd = availableBlockEnd ?? avail.end
    const step = zone.blockDurationMinutes
    const slots: number[] = []
    for (let m = blockStart; m <= blockEnd - step; m += step) {
      slots.push(m)
    }
    return slots
  }, [zone, dayKey, availableBlockStart, availableBlockEnd])

  const endTimeOptions = useMemo(() => {
    if (!zone || dayKey === undefined || startMinutes === undefined) return []
    return computeEndTimeOptions(zone, dayKey, startMinutes, bookings)
  }, [zone, dayKey, startMinutes, bookings])

  useEffect(() => {
    if (timeSlots.length === 1 && startMinutes === undefined) {
      setStartMinutes(timeSlots[0])
    }
  }, [timeSlots, startMinutes])

  useEffect(() => {
    if (endTimeOptions.length === 1 && endMinutes === undefined) {
      setEndMinutes(endTimeOptions[0].endMinutes)
    }
  }, [endTimeOptions, endMinutes])

  const formattedDate = useMemo(() => {
    if (!initialDate) return ''
    return DATE_FORMATTER.format(new Date(initialDate + 'T12:00:00'))
  }, [initialDate])

  const color = zone ? ZONE_COLORS[zone.colorIndex % ZONE_COLORS.length] : null

  const effectiveResidentId = isAdmin
    ? (selectedResidentId as Id<'residents'>) || undefined
    : residentId

  const canSubmit =
    !mutation.isPending &&
    !!zone &&
    startMinutes !== undefined &&
    endMinutes !== undefined &&
    !!effectiveResidentId

  async function handleSubmit() {
    if (
      !zone ||
      startMinutes === undefined ||
      endMinutes === undefined ||
      !initialDate ||
      !effectiveResidentId
    )
      return

    try {
      await mutation.mutateAsync({
        zoneId: zone._id,
        residentId: effectiveResidentId,
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

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
  }

  // ---- Shared form body ----
  const formBody = (
    <div className="flex flex-col gap-4">
      {zone && color && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Zona</span>
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
            <span
              className={`inline-block size-2.5 rounded-full ${color.dot}`}
            />
            {zone.name}
          </div>
        </div>
      )}

      {initialDate && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Fecha</span>
          <div className="rounded-md bg-muted px-3 py-2 text-sm capitalize">
            {formattedDate}
          </div>
        </div>
      )}

      {zone && timeSlots.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Desde</span>
          <Select
            value={
              startMinutes !== undefined ? String(startMinutes) : undefined
            }
            onValueChange={(val) => {
              setStartMinutes(Number(val))
              setEndMinutes(undefined)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder="Selecciona horario"
                valueFormatterFunction={minutesValueFormatter}
              />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {formatTime12h(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {zone && startMinutes !== undefined && endTimeOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Hasta</span>
          <Select
            value={endMinutes !== undefined ? String(endMinutes) : undefined}
            onValueChange={(val) => setEndMinutes(Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder="Selecciona hora de fin"
                valueFormatterFunction={endTimeValueFormatter(endTimeOptions)}
              />
            </SelectTrigger>
            <SelectContent>
              {endTimeOptions.map((opt) => (
                <SelectItem key={opt.endMinutes} value={String(opt.endMinutes)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isAdmin && (
        <AdminResidentSelector
          complexId={complexId}
          selectedUnitId={selectedUnitId}
          onUnitChange={(unitId) => {
            setSelectedUnitId(unitId)
            setSelectedResidentId('')
          }}
          selectedResidentId={selectedResidentId}
          onResidentChange={setSelectedResidentId}
        />
      )}
    </div>
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nueva reserva</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>{formBody}</ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            render={<Button variant="outline">Cancelar</Button>}
          />
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {mutation.isPending ? 'Reservando...' : 'Reservar'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

// ---------------------------------------------------------------------------
// Admin resident selector sub-component
// ---------------------------------------------------------------------------

function AdminResidentSelector({
  complexId,
  selectedUnitId,
  onUnitChange,
  selectedResidentId,
  onResidentChange,
}: {
  complexId: Id<'complexes'>
  selectedUnitId: string
  onUnitChange: (unitId: string) => void
  selectedResidentId: string
  onResidentChange: (residentId: string) => void
}) {
  const { data: unitsData } = useQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )

  const allUnits = useMemo(() => {
    if (!unitsData) return []
    const units: Array<{ _id: string; tower: string; number: string }> = []
    for (const group of unitsData.towers) {
      for (const unit of group.units) {
        units.push(unit)
      }
    }
    return units
  }, [unitsData])

  const unitOptions = useMemo(() => buildUnitOptions(allUnits), [allUnits])

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Unidad</span>
        <SearchableSelect
          value={selectedUnitId}
          onValueChange={onUnitChange}
          options={unitOptions}
          placeholder="Seleccionar unidad..."
          searchPlaceholder="Buscar unidad..."
        />
      </div>

      {selectedUnitId && (
        <ResidentSelect
          unitId={selectedUnitId as Id<'units'>}
          value={selectedResidentId}
          onValueChange={onResidentChange}
        />
      )}
    </>
  )
}

function ResidentSelect({
  unitId,
  value,
  onValueChange,
}: {
  unitId: Id<'units'>
  value: string
  onValueChange: (value: string) => void
}) {
  const { data: residents } = useQuery(
    convexQuery(api.residents.queries.listByUnit, { unitId }),
  )

  const activeResidents = useMemo(
    () => (residents ?? []).filter((r) => r.active),
    [residents],
  )

  useEffect(() => {
    if (activeResidents.length === 1 && !value) {
      onValueChange(activeResidents[0]._id)
    }
  }, [activeResidents, value, onValueChange])

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Residente</span>
      <Select
        value={value || undefined}
        onValueChange={(val) => {
          if (val) onValueChange(val)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar residente..." />
        </SelectTrigger>
        <SelectContent>
          {activeResidents.map((r) => (
            <SelectItem key={r._id} value={r._id}>
              {r.firstName} {r.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
