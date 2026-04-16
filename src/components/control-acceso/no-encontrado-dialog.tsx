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
import { detectPlacaTipo, isPlacaValida } from '../../../convex/lib/placa'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import { RegistrarResidenteSheet } from './registrar-residente-sheet'
import {
  TipoVehiculoCards,
  type TipoVehiculoSelectable,
} from './tipo-vehiculo-cards'

type SubScreen = 'OPTIONS' | 'VISITANTE' | 'VIOLACIONES' | 'RESIDENTE'

interface PendingVisitante {
  tipo: 'VISITANTE' | 'VISITA_ADMIN'
  unidadId?: Id<'unidades'>
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
  conjuntoId: Id<'conjuntos'>
  placa: string
  placaRaw: string
}

export function NoEncontradoDialog({
  open,
  onClose,
  conjuntoId,
  placa,
  placaRaw,
}: NoEncontradoDialogProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('OPTIONS')
  const [selectedUnidadId, setSelectedUnidadId] = useState<string>('')
  const [tipo, setTipo] = useState<TipoVehiculoSelectable>(
    detectPlacaTipo(placa) ?? 'CARRO',
  )
  const [pending, setPending] = useState<PendingVisitante | null>(null)
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [justificacion, setJustificacion] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Auto-switch tipo cuando cambia la placa (e.g., usuario regresa con otro valor).
  useEffect(() => {
    const detected = detectPlacaTipo(placa)
    if (detected) setTipo(detected)
  }, [placa])

  const placaValida = isPlacaValida(placa)

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )
  const unidades = unidadesData.torres.flatMap((t) => t.unidades)
  const unidadOptions = buildUnidadOptions(unidades)

  const registrarVisitanteFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarVisitante,
  )
  const registrarVisitanteMut = useMutation({
    mutationFn: registrarVisitanteFn,
  })

  const resetAll = () => {
    setSubScreen('OPTIONS')
    setSelectedUnidadId('')
    setPending(null)
    setViolations([])
    setJustificacion('')
    setObservaciones('')
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const submitVisitante = async (
    req: PendingVisitante,
    overrides?: { justificacion?: string; observaciones?: string },
  ) => {
    try {
      const result = await registrarVisitanteMut.mutateAsync({
        conjuntoId,
        placaRaw,
        tipo: req.tipo,
        vehiculoTipo: req.vehiculoTipo,
        unidadId: req.unidadId,
        ...(overrides?.justificacion
          ? {
              forzarPermitido: true,
              justificacion: overrides.justificacion.trim(),
              observaciones: overrides.observaciones?.trim() || undefined,
            }
          : {}),
      })

      if ('requiresJustificacion' in result && result.requiresJustificacion) {
        setPending(req)
        setViolations(result.violations)
        setSubScreen('VIOLACIONES')
        return
      }

      toast.success(
        req.tipo === 'VISITA_ADMIN'
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
    void submitVisitante({ tipo: 'VISITA_ADMIN', vehiculoTipo: tipo })
  }

  const handleVisitanteConfirmar = () => {
    if (!selectedUnidadId || !placaValida) {
      if (!selectedUnidadId) toast.error('Selecciona una unidad de destino')
      return
    }
    void submitVisitante({
      tipo: 'VISITANTE',
      vehiculoTipo: tipo,
      unidadId: selectedUnidadId as Id<'unidades'>,
    })
  }

  const handleConfirmarJustificacion = () => {
    if (!pending) return
    if (!justificacion.trim()) {
      toast.error('Justificación obligatoria')
      return
    }
    void submitVisitante(pending, {
      justificacion,
      observaciones,
    })
  }

  const isPending = registrarVisitanteMut.isPending

  const dialogOpen = open && subScreen !== 'RESIDENTE'
  const sheetOpen = open && subScreen === 'RESIDENTE'

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
                    onClick={() => setSubScreen('VISITANTE')}
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
                    onClick={() => setSubScreen('RESIDENTE')}
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

            {subScreen === 'VISITANTE' && (
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
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    placeholder="Explique por qué se permite el ingreso..."
                    className="min-h-20"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Observaciones (opcional)</FieldLabel>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
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
            {subScreen === 'VISITANTE' && (
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
                      pending?.tipo === 'VISITANTE' ? 'VISITANTE' : 'OPTIONS',
                    )
                    setViolations([])
                    setJustificacion('')
                    setObservaciones('')
                  }}
                  disabled={isPending}
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleConfirmarJustificacion}
                  disabled={isPending || !justificacion.trim()}
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
        conjuntoId={conjuntoId}
        placa={placa}
        placaRaw={placaRaw}
        initialTipo={tipo}
      />
    </>
  )
}
