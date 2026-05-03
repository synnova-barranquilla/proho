import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { PlacaInput } from '#/components/ui/formatted-input'
import { Input } from '#/components/ui/input'
import { SearchableSelect } from '#/components/ui/searchable-select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import { buildUnitOptions } from '#/lib/unit-search'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  detectPlateType,
  isValidPlateForType,
  PLATE_FORMAT_HINT,
  PLATE_LENGTH,
} from '../../../convex/lib/plate'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import { VIOLATION_LABELS_LONG as VIOLATION_LABELS } from './types'
import {
  VehicleTypeCards,
  type SelectableVehicleType,
} from './vehicle-type-cards'

interface RegisterResidentSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  complexId: Id<'complexes'>
  plate: string
  plateRaw: string
  initialVehicleType?: SelectableVehicleType
}

export function RegisterResidentSheet({
  open,
  onClose,
  onSuccess,
  complexId,
  plate,
  plateRaw,
  initialVehicleType,
}: RegisterResidentSheetProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [vehicleType, setVehicleType] = useState<SelectableVehicleType>(
    initialVehicleType ?? detectPlateType(plate) ?? 'CAR',
  )
  const [ownerName, setOwnerName] = useState('')
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [justification, setJustification] = useState('')
  const [observations, setObservations] = useState('')
  const [showViolations, setShowViolations] = useState(false)

  // Keep vehicle type in sync if the plate changes (shouldn't happen here,
  // but guards against component reuse).
  useEffect(() => {
    const detected = detectPlateType(plate)
    if (detected) setVehicleType(detected)
  }, [plate])

  const isPlateValid =
    plate.length === PLATE_LENGTH && isValidPlateForType(plate, vehicleType)
  const showPlateError = plate.length === PLATE_LENGTH && !isPlateValid

  const { data: unitsData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const units = unitsData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unitOptions = buildUnitOptions(units)

  const registerFn = useConvexMutation(
    api.accessRecords.mutations.registerNewResident,
  )
  const registerMut = useMutation({ mutationFn: registerFn })

  const handleClose = () => {
    setSelectedUnitId('')
    setVehicleType(initialVehicleType ?? detectPlateType(plate) ?? 'CAR')
    setOwnerName('')
    setViolations([])
    setJustification('')
    setObservations('')
    setShowViolations(false)
    onClose()
  }

  const handleFinishSuccess = (message: string) => {
    toast.success(message)
    if (onSuccess) {
      onSuccess()
    } else {
      handleClose()
    }
  }

  const handleMutation = async (extras: {
    registerOnly?: boolean
    forcePermitted?: boolean
  }) => {
    if (!selectedUnitId) {
      toast.error('Selecciona una unidad')
      return
    }
    try {
      const result = await registerMut.mutateAsync({
        complexId,
        rawPlate: plateRaw,
        unitId: selectedUnitId as Id<'units'>,
        vehicleType,
        ownerName: ownerName.trim() || undefined,
        ...(extras.registerOnly ? { registerOnly: true } : {}),
        ...(extras.forcePermitted
          ? {
              forcePermitted: true,
              justification: justification.trim(),
              observations: observations.trim() || undefined,
            }
          : {}),
      })

      if ('requiresJustification' in result && result.requiresJustification) {
        setViolations(result.violations)
        setShowViolations(true)
        return
      }

      handleFinishSuccess(
        'soloRegistrado' in result
          ? 'Vehículo registrado'
          : 'Vehículo registrado e ingreso permitido',
      )
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showViolations) {
      void handleMutation({ forcePermitted: true })
    } else {
      void handleMutation({})
    }
  }

  const handleRegisterOnly = () => {
    void handleMutation({ registerOnly: true })
  }

  const isPending = registerMut.isPending
  const disableSubmit =
    isPending ||
    !selectedUnitId ||
    !isPlateValid ||
    (showViolations && !justification.trim())

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Registrar vehículo como residente</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Placa</FieldLabel>
              <PlacaInput
                value={plate}
                onChange={() => {}}
                aria-invalid={showPlateError}
                disabled
              />
              {showPlateError && (
                <p className="text-sm text-destructive">{PLATE_FORMAT_HINT}</p>
              )}
            </Field>
            <Field>
              <FieldLabel>Unidad</FieldLabel>
              <SearchableSelect
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
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
              <FieldLabel>Propietario (opcional)</FieldLabel>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nombre del propietario"
              />
            </Field>
          </FieldGroup>

          {showViolations && violations.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Reglas violadas:
              </p>
              {violations.map((v) => (
                <p key={v} className="text-sm">
                  {VIOLATION_LABELS[v]}
                </p>
              ))}
              <Field>
                <FieldLabel>Justificación</FieldLabel>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explique por qué se permite el ingreso..."
                  className="min-h-20"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Observaciones (opcional)</FieldLabel>
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observaciones adicionales del vigilante..."
                  className="min-h-16"
                />
              </Field>
            </div>
          )}

          <SheetFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            {!showViolations && (
              <Button
                variant="outline"
                type="button"
                onClick={handleRegisterOnly}
                disabled={isPending || !selectedUnitId || !isPlateValid}
              >
                Solo registrar
              </Button>
            )}
            <Button type="submit" disabled={disableSubmit}>
              {isPending
                ? 'Registrando...'
                : showViolations
                  ? 'Permitir con justificación'
                  : 'Registrar e ingresar'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
