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
import { VIOLATION_LABELS_LONG as VIOLATION_LABELS } from './types'

interface ViolacionesDialogProps {
  open: boolean
  onClose: () => void
  complexId: Id<'complexes'>
  placa: string
  placaRaw: string
  violations: RuleViolation[]
  unidadInfo: string
}

export function ViolacionesDialog({
  open,
  onClose,
  complexId,
  placa,
  placaRaw,
  violations,
  unidadInfo,
}: ViolacionesDialogProps) {
  const [justification, setJustification] = useState('')
  const [observations, setObservations] = useState('')

  const registrarIngresoFn = useConvexMutation(
    api.accessRecords.mutations.registerEntry,
  )
  const registrarIngresoMut = useMutation({ mutationFn: registrarIngresoFn })

  const registrarRechazoFn = useConvexMutation(
    api.accessRecords.mutations.registerRejection,
  )
  const registrarRechazoMut = useMutation({ mutationFn: registrarRechazoFn })

  const isPending =
    registrarIngresoMut.isPending || registrarRechazoMut.isPending

  const handlePermitir = async () => {
    try {
      await registrarIngresoMut.mutateAsync({
        complexId,
        rawPlate: placaRaw,
        forcePermitted: true,
        justification,
        observations: observations.trim() || undefined,
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
        complexId,
        rawPlate: placaRaw,
        type: 'RESIDENT',
        engineDecision: violations,
      })
      toast.error('Ingreso rechazado')
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al registrar rechazo')
      } else {
        toast.error('Error al registrar rechazo')
      }
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
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explique por qué se permite el ingreso..."
                className="min-h-20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Observaciones (opcional)
              </label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observaciones adicionales del vigilante..."
                className="min-h-16"
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
            disabled={isPending || !justification.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {registrarIngresoMut.isPending ? 'Registrando...' : 'Permitir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
