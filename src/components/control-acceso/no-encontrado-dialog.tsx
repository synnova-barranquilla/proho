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
import { buildUnidadOptions } from '#/lib/unidad-search'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  detectPlacaTipo,
  isPlacaValidaParaTipo,
} from '../../../convex/lib/placa'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import { RegistrarResidenteSheet } from './registrar-residente-sheet'
import {
  TipoVehiculoCards,
  type TipoVehiculoSelectable,
} from './tipo-vehiculo-cards'

type SubScreen = 'OPTIONS' | 'VISITOR' | 'VIOLACIONES' | 'RESIDENT'

interface PendingVisitante {
  tipo: 'VISITOR' | 'ADMIN_VISIT'
  unitId?: Id<'units'>
  vehiculoTipo: TipoVehiculoSelectable
}

const VIOLATION_LABELS: Record<RuleViolation, string> = {
  MORA: 'La unidad está en mora',
  VEHICULO_DUPLICADO: 'Vehículo duplicado',
  MOTO_ADICIONAL: 'Moto adicional',
  PERMANENCIA_EXCEDIDA: 'Permanencia excedida',
  SOBRECUPO_CARROS: 'Sobrecupo de parqueadero de carros',
  SOBRECUPO_MOTOS: 'Sobrecupo de parqueadero de motos',
}

interface NoEncontradoDialogProps {
  open: boolean
  onClose: () => void
  complexId: Id<'complexes'>
  placa: string
  placaRaw: string
}

export function NoEncontradoDialog({
  open,
  onClose,
  complexId,
  placa,
  placaRaw,
}: NoEncontradoDialogProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('OPTIONS')
  const [selectedUnidadId, setSelectedUnidadId] = useState<string>('')
  const [tipo, setTipo] = useState<TipoVehiculoSelectable>(
    detectPlacaTipo(placa) ?? 'CAR',
  )
  const [pending, setPending] = useState<PendingVisitante | null>(null)
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [justification, setJustification] = useState('')
  const [observations, setObservations] = useState('')

  // Auto-switch tipo cuando cambia la placa (e.g., usuario regresa con otro valor).
  useEffect(() => {
    const detected = detectPlacaTipo(placa)
    if (detected) setTipo(detected)
  }, [placa])

  const placaValida = placa.length === 6 && isPlacaValidaParaTipo(placa, tipo)

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const unidades = unidadesData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unidadOptions = buildUnidadOptions(unidades)

  const registrarVisitanteFn = useConvexMutation(
    api.accessRecords.mutations.registerVisitor,
  )
  const registrarVisitanteMut = useMutation({
    mutationFn: registrarVisitanteFn,
  })

  const resetAll = () => {
    setSubScreen('OPTIONS')
    setSelectedUnidadId('')
    setPending(null)
    setViolations([])
    setJustification('')
    setObservations('')
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const submitVisitante = async (
    req: PendingVisitante,
    overrides?: { justification?: string; observations?: string },
  ) => {
    try {
      const result = await registrarVisitanteMut.mutateAsync({
        complexId,
        rawPlate: placaRaw,
        type: req.tipo,
        vehicleType: req.vehiculoTipo,
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
        req.tipo === 'ADMIN_VISIT'
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

  const handleVisitaAdmin = () => {
    if (!placaValida) return
    void submitVisitante({ tipo: 'ADMIN_VISIT', vehiculoTipo: tipo })
  }

  const handleVisitanteConfirmar = () => {
    if (!selectedUnidadId || !placaValida) {
      if (!selectedUnidadId) toast.error('Selecciona una unidad de destino')
      return
    }
    void submitVisitante({
      tipo: 'VISITOR',
      vehiculoTipo: tipo,
      unitId: selectedUnidadId as Id<'units'>,
    })
  }

  const handleConfirmarJustificacion = () => {
    if (!pending) return
    if (!justification.trim()) {
      toast.error('Justificación obligatoria')
      return
    }
    void submitVisitante(pending, {
      justification,
      observations,
    })
  }

  const isPending = registrarVisitanteMut.isPending

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
              {formatPlaca(placa)}
            </p>
          </DialogHeader>
          <DialogBody>
            {subScreen === 'OPTIONS' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Tipo de vehículo
                  </label>
                  <TipoVehiculoCards value={tipo} onValueChange={setTipo} />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setSubScreen('VISITOR')}
                    disabled={!placaValida}
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
                    onClick={handleVisitaAdmin}
                    disabled={isPending || !placaValida}
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
                    disabled={!placaValida}
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
                    value={selectedUnidadId}
                    onValueChange={setSelectedUnidadId}
                    options={unidadOptions}
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
                    setSelectedUnidadId('')
                  }}
                  disabled={isPending}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleVisitanteConfirmar}
                  disabled={isPending || !selectedUnidadId || !placaValida}
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
                      pending?.tipo === 'VISITOR' ? 'VISITOR' : 'OPTIONS',
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
                  onClick={handleConfirmarJustificacion}
                  disabled={isPending || !justification.trim()}
                >
                  {isPending ? 'Registrando...' : 'Permitir con justificación'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegistrarResidenteSheet
        open={sheetOpen}
        onClose={() => setSubScreen('OPTIONS')}
        onSuccess={() => {
          setSubScreen('OPTIONS')
          onClose()
        }}
        complexId={complexId}
        placa={placa}
        placaRaw={placaRaw}
        initialTipo={tipo}
      />
    </>
  )
}
