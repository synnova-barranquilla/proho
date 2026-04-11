import { AlertTriangle } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { formatPlaca } from '#/lib/formatters'
import type { RegistroActivo } from './types'

function formatTimeAgo(timestamp: number | undefined): string {
  if (timestamp == null) return '—'
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

interface YaDentroDialogProps {
  open: boolean
  onClose: () => void
  registro: RegistroActivo
  onRegistrarSalida: () => void
}

export function YaDentroDialog({
  open,
  onClose,
  registro,
  onRegistrarSalida,
}: YaDentroDialogProps) {
  const unidad = registro.unidad
  const unidadLabel = unidad ? `T${unidad.torre} — ${unidad.numero}` : '—'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle className="text-orange-600">
              Vehículo ya está dentro
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-medium">
                {formatPlaca(registro.placaNormalizada)}
              </span>
              <span className="text-sm text-muted-foreground">
                {unidadLabel}
              </span>
            </div>
            <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm dark:border-orange-900 dark:bg-orange-950/20">
              Ingresó {formatTimeAgo(registro.entradaEn)}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button onClick={onRegistrarSalida}>Registrar salida</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
