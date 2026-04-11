import { useState } from 'react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'

type VehiculoTipo = 'CARRO' | 'MOTO' | 'OTRO'

const VIOLATION_LABELS: Record<RuleViolation, string> = {
  MORA: 'La unidad está en mora de administración',
  VEHICULO_DUPLICADO: 'Ya hay un vehículo de esta unidad dentro',
  MOTO_ADICIONAL: 'Ya hay un vehículo dentro y se agrega una moto',
  PERMANENCIA_EXCEDIDA: 'Un vehículo de la unidad supera la permanencia máxima',
}

interface RegistrarResidenteSheetProps {
  open: boolean
  onClose: () => void
  conjuntoId: Id<'conjuntos'>
  placa: string
  placaRaw: string
}

export function RegistrarResidenteSheet({
  open,
  onClose,
  conjuntoId,
  placa,
  placaRaw,
}: RegistrarResidenteSheetProps) {
  const [selectedUnidadId, setSelectedUnidadId] = useState<string>('')
  const [tipo, setTipo] = useState<VehiculoTipo>('CARRO')
  const [propietario, setPropietario] = useState('')
  const [observacion, setObservacion] = useState('')
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [justificacion, setJustificacion] = useState('')
  const [showViolations, setShowViolations] = useState(false)

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )
  const unidades = unidadesData.torres.flatMap((t) => t.unidades)
  const unidadOptions = unidades.map((u) => ({
    value: u._id,
    label: `Torre ${u.torre} — ${u.numero}`,
  }))

  const registrarFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarResidenteNuevo,
  )
  const registrarMut = useMutation({ mutationFn: registrarFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        observacion: observacion.trim() || undefined,
        ...(showViolations
          ? { forzarPermitido: true, justificacion: justificacion.trim() }
          : {}),
      })

      if ('requiresJustificacion' in result && result.requiresJustificacion) {
        setViolations(result.violations)
        setShowViolations(true)
        return
      }

      toast.success('Vehículo registrado e ingreso permitido')
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

  const handleClose = () => {
    setSelectedUnidadId('')
    setTipo('CARRO')
    setPropietario('')
    setObservacion('')
    setViolations([])
    setJustificacion('')
    setShowViolations(false)
    onClose()
  }

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
              <PlacaInput value={placa} onChange={() => {}} disabled />
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
              <Select
                value={tipo}
                onValueChange={(val) => val && setTipo(val as VehiculoTipo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARRO">Carro</SelectItem>
                  <SelectItem value="MOTO">Moto</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Propietario (opcional)</FieldLabel>
              <Input
                value={propietario}
                onChange={(e) => setPropietario(e.target.value)}
                placeholder="Nombre del propietario"
              />
            </Field>
            <Field>
              <FieldLabel>Observación (opcional)</FieldLabel>
              <Textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Nota adicional..."
                className="min-h-16"
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
            </div>
          )}

          <SheetFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={registrarMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                registrarMut.isPending ||
                !selectedUnidadId ||
                (showViolations && !justificacion.trim())
              }
            >
              {registrarMut.isPending
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
