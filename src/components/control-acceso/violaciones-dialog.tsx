import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { AlertTriangle } from 'lucide-react'
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
import { Textarea } from '#/components/ui/textarea'
import { formatPlaca } from '#/lib/formatters'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { RuleViolation } from '../../../convex/lib/rulesEngine'

const VIOLATION_LABELS: Record<RuleViolation, string> = {
  MORA: 'La unidad está en mora de administración',
  VEHICULO_DUPLICADO: 'Ya hay un vehículo de esta unidad dentro',
  MOTO_ADICIONAL: 'Ya hay un vehículo dentro y se agrega una moto',
  PERMANENCIA_EXCEDIDA: 'Un vehículo de la unidad supera la permanencia máxima',
}

interface ViolacionesDialogProps {
  open: boolean
  onClose: () => void
  conjuntoId: Id<'conjuntos'>
  placa: string
  placaRaw: string
  violations: RuleViolation[]
  unidadInfo: string
}

export function ViolacionesDialog({
  open,
  onClose,
  conjuntoId,
  placa,
  placaRaw,
  violations,
  unidadInfo,
}: ViolacionesDialogProps) {
  const [justificacion, setJustificacion] = useState('')

  const registrarIngresoFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarIngreso,
  )
  const registrarIngresoMut = useMutation({ mutationFn: registrarIngresoFn })

  const registrarRechazoFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarRechazo,
  )
  const registrarRechazoMut = useMutation({ mutationFn: registrarRechazoFn })

  const isPending =
    registrarIngresoMut.isPending || registrarRechazoMut.isPending

  const handlePermitir = async () => {
    try {
      await registrarIngresoMut.mutateAsync({
        conjuntoId,
        placaRaw,
        forzarPermitido: true,
        justificacion,
      })
      toast.success('Ingreso registrado con justificación')
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const handleRechazar = async () => {
    try {
      await registrarRechazoMut.mutateAsync({
        conjuntoId,
        placaRaw,
        tipo: 'RESIDENTE',
        decisionMotor: violations,
      })
      toast.error('Ingreso rechazado')
      onClose()
    } catch (err) {
      toast.error('Error al registrar rechazo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle className="text-amber-600">
              Reglas violadas
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-medium">
                {formatPlaca(placa)}
              </span>
              {unidadInfo && (
                <span className="text-sm text-muted-foreground">
                  {unidadInfo}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {violations.map((v) => (
                <div
                  key={v}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/20"
                >
                  {VIOLATION_LABELS[v]}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Justificación</label>
              <Textarea
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Explique por qué se permite el ingreso..."
                className="min-h-20"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRechazar}
            disabled={isPending}
          >
            Rechazar
          </Button>
          <Button
            onClick={handlePermitir}
            disabled={isPending || !justificacion.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {registrarIngresoMut.isPending ? 'Registrando...' : 'Permitir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
