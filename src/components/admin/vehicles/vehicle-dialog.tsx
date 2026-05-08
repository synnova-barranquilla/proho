import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { PlacaInput } from '#/components/ui/formatted-input'
import { Input } from '#/components/ui/input'
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
import { buildUnitOptions } from '#/lib/unit-search'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  detectPlateType,
  isValidPlateForType,
  PLATE_FORMAT_HINT,
  PLATE_LENGTH,
} from '../../../../convex/lib/plate'
import {
  VehicleTypeCards,
  type SelectableVehicleType,
} from '../../control-acceso/vehicle-type-cards'

type VehicleRow = Doc<'vehicles'> & { unit: Doc<'units'> | null }

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  vehicle: VehicleRow | null
}

export function VehicleDialog({
  open,
  onOpenChange,
  complexId,
  vehicle,
}: VehicleDialogProps) {
  const isEdit = vehicle !== null

  const [unitId, setUnitId] = useState<string>('')
  const [plate, setPlate] = useState('')
  const [vehicleType, setVehicleType] = useState<SelectableVehicleType>('CAR')
  const [ownerName, setOwnerName] = useState('')

  const isPlateValid =
    plate.length === PLATE_LENGTH && isValidPlateForType(plate, vehicleType)
  const showPlateError = plate.length === PLATE_LENGTH && !isPlateValid

  useEffect(() => {
    if (open) {
      setUnitId(vehicle?.unitId ?? '')
      setPlate(vehicle?.plate ?? '')
      const vType = vehicle?.type ?? 'CAR'
      setVehicleType(vType === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR')
      setOwnerName(vehicle?.ownerName ?? '')
    }
  }, [open, vehicle])

  // Auto-detect vehicle type when plate matches a specific format
  useEffect(() => {
    const detected = detectPlateType(plate)
    if (detected) setVehicleType(detected)
  }, [plate])

  const { data: unitsData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const units = unitsData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unitOptions = buildUnitOptions(units)

  const createFn = useConvexMutation(api.vehicles.mutations.create)
  const updateFn = useConvexMutation(api.vehicles.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })
  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (vehicle !== null) {
        await updateMut.mutateAsync({
          vehicleId: vehicle._id,
          unitId: unitId as Id<'units'>,
          plate,
          type: vehicleType,
          ownerName: ownerName || undefined,
        })
        toast.success('Vehículo actualizado')
      } else {
        if (!unitId) {
          toast.error('Selecciona una unidad')
          return
        }
        await createMut.mutateAsync({
          unitId: unitId as Id<'units'>,
          plate,
          type: vehicleType,
          ownerName: ownerName || undefined,
        })
        toast.success('Vehículo creado')
      }
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEdit ? 'Editar vehículo' : 'Nuevo vehículo'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ResponsiveDialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Unidad</FieldLabel>
                <SearchableSelect
                  value={unitId}
                  onValueChange={setUnitId}
                  options={unitOptions}
                  placeholder="Selecciona una unidad"
                  searchPlaceholder="Buscar por torre o número..."
                />
              </Field>
              <Field>
                <FieldLabel>Tipo de vehículo</FieldLabel>
                <VehicleTypeCards
                  value={vehicleType}
                  onValueChange={setVehicleType}
                />
              </Field>
              <Field>
                <FieldLabel>Placa</FieldLabel>
                <PlacaInput
                  value={plate}
                  onChange={setPlate}
                  aria-invalid={showPlateError}
                  required
                />
                {showPlateError && (
                  <p className="text-sm text-destructive">
                    {PLATE_FORMAT_HINT}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel>Propietario (opcional)</FieldLabel>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nombre si no coincide con el residente principal"
                />
              </Field>
            </FieldGroup>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              render={<Button variant="outline">Cancelar</Button>}
            />
            <Button type="submit" disabled={isPending || !isPlateValid}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
