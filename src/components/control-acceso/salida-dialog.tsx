import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { LogOut } from 'lucide-react'
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
import type { RegistroActivo } from './types'

function formatPermanencia(entradaEn: number | undefined): string {
  if (entradaEn == null) return 'Sin registro de entrada'
  const diff = Date.now() - entradaEn
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Menos de 1 minuto'
  if (mins < 60) return `${mins} minuto${mins !== 1 ? 's' : ''}`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hours < 24) {
    return `${hours}h ${remainingMins}m`
  }
  const days = Math.floor(hours / 24)
  return `${days} día${days !== 1 ? 's' : ''} ${hours % 24}h`
}

interface SalidaDialogProps {
  open: boolean
  onClose: () => void
  conjuntoId: Id<'conjuntos'>
  registro: RegistroActivo
}

export function SalidaDialog({
  open,
  onClose,
  conjuntoId,
  registro,
}: SalidaDialogProps) {
  const [observacion, setObservacion] = useState('')

  const registrarSalidaFn = useConvexMutation(
    api.registrosAcceso.mutations.registrarSalida,
  )
  const registrarSalidaMut = useMutation({ mutationFn: registrarSalidaFn })

  const handleConfirmar = async () => {
    try {
      await registrarSalidaMut.mutateAsync({
        conjuntoId,
        placaRaw: registro.placaNormalizada,
        observacion: observacion.trim() || undefined,
      })
      toast.success('Salida registrada')
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

  const unidad = registro.unidad
  const unidadLabel = unidad ? `T${unidad.torre} — ${unidad.numero}` : '—'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <LogOut className="h-6 w-6" />
            <DialogTitle className="text-blue-600">
              Registrar salida
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-medium">
                {formatPlaca(registro.placaNormalizada)}
              </span>
              <span className="text-sm text-muted-foreground">
                {unidadLabel}
              </span>
            </div>

            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Permanencia: </span>
              <span className="font-medium">
                {formatPermanencia(registro.entradaEn)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Observación (opcional)
              </label>
              <Textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Nota sobre la salida..."
                className="min-h-16"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={registrarSalidaMut.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={registrarSalidaMut.isPending}
          >
            {registrarSalidaMut.isPending
              ? 'Registrando...'
              : 'Confirmar salida'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
