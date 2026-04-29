import { useEffect, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

type UnidadTipo = Doc<'units'>['type']

interface UnidadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  unidad: Doc<'units'> | null
}

export function UnidadDialog({
  open,
  onOpenChange,
  complexId,
  unidad,
}: UnidadDialogProps) {
  const isEdit = unidad !== null

  const [tower, setTower] = useState('')
  const [number, setNumber] = useState('')
  const [tipo, setTipo] = useState<UnidadTipo>('APARTMENT')

  useEffect(() => {
    if (open) {
      setTower(unidad?.tower ?? '')
      setNumber(unidad?.number ?? '')
      setTipo(unidad?.type ?? 'APARTMENT')
    }
  }, [open, unidad])

  const createFn = useConvexMutation(api.units.mutations.create)
  const updateFn = useConvexMutation(api.units.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (unidad !== null) {
        await updateMut.mutateAsync({
          unitId: unidad._id,
          tower,
          number,
          type: tipo,
        })
        toast.success('Unidad actualizada')
      } else {
        await createMut.mutateAsync({
          complexId,
          tower,
          number,
          type: tipo,
        })
        toast.success('Unidad creada')
      }
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al guardar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar unidad' : 'Nueva unidad'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Torre</FieldLabel>
                  <Input
                    value={tower}
                    onChange={(e) => setTower(e.target.value)}
                    placeholder="A"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Número</FieldLabel>
                  <Input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="301"
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Apartamento</SelectItem>
                    <SelectItem value="HOUSE">Casa</SelectItem>
                    <SelectItem value="COMMERCIAL">Local</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
