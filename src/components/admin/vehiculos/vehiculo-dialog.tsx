import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
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
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { PlacaInput } from '#/components/ui/formatted-input'
import { Input } from '#/components/ui/input'
import { SearchableSelect } from '#/components/ui/searchable-select'
import { buildUnidadOptions } from '#/lib/unidad-search'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import {
  detectPlacaTipo,
  isPlacaValidaParaTipo,
  PLACA_FORMAT_HINT,
} from '../../../../convex/lib/placa'
import {
  TipoVehiculoCards,
  type TipoVehiculoSelectable,
} from '../../control-acceso/tipo-vehiculo-cards'

type VehiculoRow = Doc<'vehicles'> & { unit: Doc<'units'> | null }

interface VehiculoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  vehiculo: VehiculoRow | null
}

export function VehiculoDialog({
  open,
  onOpenChange,
  complexId,
  vehiculo,
}: VehiculoDialogProps) {
  const isEdit = vehiculo !== null

  const [unitId, setUnitId] = useState<string>('')
  const [plate, setPlate] = useState('')
  const [tipo, setTipo] = useState<TipoVehiculoSelectable>('CAR')
  const [propietario, setPropietario] = useState('')

  const placaValida = plate.length === 6 && isPlacaValidaParaTipo(plate, tipo)
  const showPlacaError = plate.length === 6 && !placaValida

  useEffect(() => {
    if (open) {
      setUnitId(vehiculo?.unitId ?? '')
      setPlate(vehiculo?.plate ?? '')
      const vehiculoTipo = vehiculo?.type ?? 'CAR'
      setTipo(vehiculoTipo === 'MOTORCYCLE' ? 'MOTORCYCLE' : 'CAR')
      setPropietario(vehiculo?.ownerName ?? '')
    }
  }, [open, vehiculo])

  // Auto-switch tipo cuando la placa matchea un formato específico
  useEffect(() => {
    const detected = detectPlacaTipo(plate)
    if (detected) setTipo(detected)
  }, [plate])

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const unidades = unidadesData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unidadOptions = buildUnidadOptions(unidades)

  const createFn = useConvexMutation(api.vehicles.mutations.create)
  const updateFn = useConvexMutation(api.vehicles.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })
  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (vehiculo !== null) {
        await updateMut.mutateAsync({
          vehicleId: vehiculo._id,
          unitId: unitId as Id<'units'>,
          plate,
          type: tipo,
          ownerName: propietario || undefined,
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
          type: tipo,
          ownerName: propietario || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar vehículo' : 'Nuevo vehículo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Unidad</FieldLabel>
                <SearchableSelect
                  value={unitId}
                  onValueChange={setUnitId}
                  options={unidadOptions}
                  placeholder="Selecciona una unidad"
                  searchPlaceholder="Buscar por torre o número..."
                />
              </Field>
              <Field>
                <FieldLabel>Tipo de vehículo</FieldLabel>
                <TipoVehiculoCards value={tipo} onValueChange={setTipo} />
              </Field>
              <Field>
                <FieldLabel>Placa</FieldLabel>
                <PlacaInput
                  value={plate}
                  onChange={setPlate}
                  aria-invalid={showPlacaError}
                  required
                />
                {showPlacaError && (
                  <p className="text-sm text-destructive">
                    {PLACA_FORMAT_HINT}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel>Propietario (opcional)</FieldLabel>
                <Input
                  value={propietario}
                  onChange={(e) => setPropietario(e.target.value)}
                  placeholder="Nombre si no coincide con el residente principal"
                />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={isPending || !placaValida}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
