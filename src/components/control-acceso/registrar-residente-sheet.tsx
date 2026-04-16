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
import { buildUnidadOptions } from '#/lib/unidad-search'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  detectPlacaTipo,
  isPlacaValidaParaTipo,
} from '../../../convex/lib/placa'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'
import {
  TipoVehiculoCards,
  type TipoVehiculoSelectable,
} from './tipo-vehiculo-cards'

const VIOLATION_LABELS: Record<RuleViolation, string> = {
  MORA: 'La unidad está en mora de administración',
  VEHICULO_DUPLICADO: 'Ya hay un vehículo de esta unidad dentro',
  MOTO_ADICIONAL: 'Ya hay un vehículo dentro y se agrega una moto',
  PERMANENCIA_EXCEDIDA: 'Un vehículo de la unidad supera la permanencia máxima',
  SOBRECUPO_CARROS: 'Sobrecupo de parqueadero de carros',
  SOBRECUPO_MOTOS: 'Sobrecupo de parqueadero de motos',
}

interface RegistrarResidenteSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  conjuntoId: Id<'conjuntos'>
  placa: string
  placaRaw: string
  initialTipo?: TipoVehiculoSelectable
}

export function RegistrarResidenteSheet({
  open,
  onClose,
  onSuccess,
  conjuntoId,
  placa,
  placaRaw,
  initialTipo,
}: RegistrarResidenteSheetProps) {
  const [selectedUnidadId, setSelectedUnidadId] = useState<string>('')
  const [tipo, setTipo] = useState<TipoVehiculoSelectable>(
    initialTipo ?? detectPlacaTipo(placa) ?? 'CARRO',
  )
  const [propietario, setPropietario] = useState('')
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [justificacion, setJustificacion] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [showViolations, setShowViolations] = useState(false)

  // Mantener tipo sincronizado si la placa cambia (no debería ocurrir aquí,
  // pero protege ante reusos del componente).
  useEffect(() => {
    const detected = detectPlacaTipo(placa)
    if (detected) setTipo(detected)
  }, [placa])

  const placaValida = placa.length === 6 && isPlacaValidaParaTipo(placa, tipo)
  const showPlacaError = placa.length === 6 && !placaValida

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )
  const unidades = unidadesData.torres.flatMap((t) => t.unidades)
  const unidadOptions = buildUnidadOptions(unidades)

  const registrarFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarResidenteNuevo,
  )
  const registrarMut = useMutation({ mutationFn: registrarFn })

  const handleClose = () => {
    setSelectedUnidadId('')
    setTipo(initialTipo ?? detectPlacaTipo(placa) ?? 'CARRO')
    setPropietario('')
    setViolations([])
    setJustificacion('')
    setObservaciones('')
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
    soloRegistrar?: boolean
    forzarPermitido?: boolean
  }) => {
    if (!selectedUnidadId) {
      toast.error('Selecciona una unidad')
      return
    }
    try {
      const result = await registrarMut.mutateAsync({
        conjuntoId,
        placaRaw,
        unidadId: selectedUnidadId as Id<'unidades'>,
        vehiculoTipo: tipo,
        propietarioNombre: propietario.trim() || undefined,
        ...(extras.soloRegistrar ? { soloRegistrar: true } : {}),
        ...(extras.forzarPermitido
          ? {
              forzarPermitido: true,
              justificacion: justificacion.trim(),
              observaciones: observaciones.trim() || undefined,
            }
          : {}),
      })

      if ('requiresJustificacion' in result && result.requiresJustificacion) {
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
      void handleMutation({ forzarPermitido: true })
    } else {
      void handleMutation({})
    }
  }

  const handleSoloRegistrar = () => {
    void handleMutation({ soloRegistrar: true })
  }

  const isPending = registrarMut.isPending
  const disableSubmit =
    isPending ||
    !selectedUnidadId ||
    !placaValida ||
    (showViolations && !justificacion.trim())

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
                value={placa}
                onChange={() => {}}
                aria-invalid={showPlacaError}
                disabled
              />
              {showPlacaError && (
                <p className="text-sm text-destructive">
                  Formato inválido — Carro: ABC-123 / Moto: ABC-12D
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel>Unidad</FieldLabel>
              <SearchableSelect
                value={selectedUnidadId}
                onValueChange={setSelectedUnidadId}
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
              <FieldLabel>Propietario (opcional)</FieldLabel>
              <Input
                value={propietario}
                onChange={(e) => setPropietario(e.target.value)}
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
                onClick={handleSoloRegistrar}
                disabled={isPending || !selectedUnidadId || !placaValida}
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
