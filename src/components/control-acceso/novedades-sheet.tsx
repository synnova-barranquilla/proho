import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
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

interface NovedadesSheetProps {
  open: boolean
  onClose: () => void
  conjuntoId: Id<'conjuntos'>
}

export function NovedadesSheet({
  open,
  onClose,
  conjuntoId,
}: NovedadesSheetProps) {
  const [descripcion, setDescripcion] = useState('')

  const crearManualFn = useConvexMutation(api.novedades.mutations.crearManual)
  const crearManualMut = useMutation({ mutationFn: crearManualFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) {
      toast.error('Descripción obligatoria')
      return
    }

    try {
      await crearManualMut.mutateAsync({
        conjuntoId,
        descripcion: descripcion.trim(),
      })
      toast.success('Novedad registrada')
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
    setDescripcion('')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Nueva novedad</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 px-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa la novedad..."
              className="min-h-32"
              autoFocus
              required
            />
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={crearManualMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={crearManualMut.isPending || !descripcion.trim()}
            >
              {crearManualMut.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
