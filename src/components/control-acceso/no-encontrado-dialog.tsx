import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Building2, Car, CircleHelp, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Field, FieldLabel } from '#/components/ui/field'
import { SearchableSelect } from '#/components/ui/searchable-select'
import { Textarea } from '#/components/ui/textarea'
import { formatPlaca } from '#/lib/formatters'
import { buildUnitOptions } from '#/lib/unit-search'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { detectPlateType, isValidPlateForType } from '../../../convex/lib/plate'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import { RegisterResidentSheet } from './register-resident-sheet'
import { VIOLATION_LABELS_LONG as VIOLATION_LABELS } from './types'
import {
  VehicleTypeCards,
  type SelectableVehicleType,
} from './vehicle-type-cards'

type SubScreen = 'OPTIONS' | 'VISITOR' | 'VIOLACIONES' | 'RESIDENT'

interface PendingVisitor {
  type: 'VISITOR' | 'ADMIN_VISIT'
  unitId?: Id<'units'>
  vehicleType: SelectableVehicleType
}

interface NotFoundDialogProps {
  open: boolean
  onClose: () => void
  complexId: Id<'complexes'>
  plate: string
  plateRaw: string
}

export function NotFoundDialog({
  open,
  onClose,
  complexId,
  plate,
  plateRaw,
}: NotFoundDialogProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('OPTIONS')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [vehicleType, setVehicleType] = useState<SelectableVehicleType>(
    detectPlateType(plate) ?? 'CAR',
  )
  const [pending, setPending] = useState<PendingVisitor | null>(null)
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [justification, setJustification] = useState('')
  const [observations, setObservations] = useState('')

  // Auto-switch vehicle type when plate changes (e.g. user navigates back with a different value).
  useEffect(() => {
    const detected = detectPlateType(plate)
    if (detected) setVehicleType(detected)
  }, [plate])

  const isPlateValid =
    plate.length === 6 && isValidPlateForType(plate, vehicleType)

  const { data: unitsData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const units = unitsData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unitOptions = buildUnitOptions(units)

  const registerVisitorFn = useConvexMutation(
    api.accessRecords.mutations.registerVisitor,
  )
  const registerVisitorMut = useMutation({
    mutationFn: registerVisitorFn,
  })

  const resetAll = () => {
    setSubScreen('OPTIONS')
    setSelectedUnitId('')
    setPending(null)
    setViolations([])
    setJustification('')
    setObservations('')
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const submitVisitor = async (
    req: PendingVisitor,
    overrides?: { justification?: string; observations?: string },
  ) => {
    try {
      const result = await registerVisitorMut.mutateAsync({
        complexId,
        rawPlate: plateRaw,
        type: req.type,
        vehicleType: req.vehicleType,
        unitId: req.unitId,
        ...(overrides?.justification
          ? {
              forcePermitted: true,
              justification: overrides.justification.trim(),
              observations: overrides.observations?.trim() || undefined,
            }
          : {}),
      })

      if ('requiresJustification' in result && result.requiresJustification) {
        setPending(req)
        setViolations(result.violations)
        setSubScreen('VIOLACIONES')
        return
      }

      toast.success(
        req.type === 'ADMIN_VISIT'
          ? 'Visita administrativa registrada'
          : 'Visitante registrado',
      )
      handleClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleAdminVisit = () => {
    if (!isPlateValid) return
    void submitVisitor({ type: 'ADMIN_VISIT', vehicleType })
  }

  const handleVisitorConfirm = () => {
    if (!selectedUnitId || !isPlateValid) {
      if (!selectedUnitId) toast.error('Selecciona una unidad de destino')
      return
    }
    void submitVisitor({
      type: 'VISITOR',
      vehicleType,
      unitId: selectedUnitId as Id<'units'>,
    })
  }

  const handleConfirmJustification = () => {
    if (!pending) return
    if (!justification.trim()) {
      toast.error('Justificación obligatoria')
      return
    }
    void submitVisitor(pending, {
      justification,
      observations,
    })
  }

  const isPending = registerVisitorMut.isPending

  const dialogOpen = open && subScreen !== 'RESIDENT'
  const sheetOpen = open && subScreen === 'RESIDENT'

  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) handleClose()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <CircleHelp className="h-6 w-6" />
              <DialogTitle>Vehículo no registrado</DialogTitle>
            </div>
            <p className="mt-1 font-mono text-lg font-medium">
              {formatPlaca(plate)}
            </p>
          </DialogHeader>
          <DialogBody>
            {subScreen === 'OPTIONS' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Tipo de vehículo
                  </label>
                  <VehicleTypeCards
                    value={vehicleType}
                    onValueChange={setVehicleType}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setSubScreen('VISITOR')}
                    disabled={!isPlateValid}
                  >
                    <UserRound className="h-6 w-6 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Visitante</p>
                      <p className="text-sm text-muted-foreground">
                        Visita a una unidad específica
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleAdminVisit}
                    disabled={isPending || !isPlateValid}
                  >
                    <Building2 className="h-6 w-6 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Visita administrativa</p>
                      <p className="text-sm text-muted-foreground">
                        Proveedor, domicilio, etc.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setSubScreen('RESIDENT')}
                    disabled={!isPlateValid}
                  >
                    <Car className="h-6 w-6 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Registrar como residente</p>
                      <p className="text-sm text-muted-foreground">
                        Agregar vehículo permanente a una unidad
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {subScreen === 'VISITOR' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Unidad de destino
                  </label>
                  <SearchableSelect
                    value={selectedUnitId}
                    onValueChange={setSelectedUnitId}
                    options={unitOptions}
                    placeholder="Selecciona una unidad"
                    searchPlaceholder="Buscar por torre o número..."
                  />
                </div>
              </div>
            )}

            {subScreen === 'VIOLACIONES' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Reglas violadas:
                  </p>
                  {violations.map((v) => (
                    <p key={v} className="text-sm">
                      {VIOLATION_LABELS[v]}
                    </p>
                  ))}
                </div>
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
          </DialogBody>
          <DialogFooter>
            {subScreen === 'OPTIONS' && (
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            )}
            {subScreen === 'VISITOR' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubScreen('OPTIONS')
                    setSelectedUnitId('')
                  }}
                  disabled={isPending}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleVisitorConfirm}
                  disabled={isPending || !selectedUnitId || !isPlateValid}
                >
                  {isPending ? 'Registrando...' : 'Confirmar visitante'}
                </Button>
              </>
            )}
            {subScreen === 'VIOLACIONES' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubScreen(
                      pending?.type === 'VISITOR' ? 'VISITOR' : 'OPTIONS',
                    )
                    setViolations([])
                    setJustification('')
                    setObservations('')
                  }}
                  disabled={isPending}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleConfirmJustification}
                  disabled={isPending || !justification.trim()}
                >
                  {isPending ? 'Registrando...' : 'Permitir con justificación'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegisterResidentSheet
        open={sheetOpen}
        onClose={() => setSubScreen('OPTIONS')}
        onSuccess={() => {
          setSubScreen('OPTIONS')
          onClose()
        }}
        complexId={complexId}
        plate={plate}
        plateRaw={plateRaw}
        initialVehicleType={vehicleType}
      />
    </>
  )
}
