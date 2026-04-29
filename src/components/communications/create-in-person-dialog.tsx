import { useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
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
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '#/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface CreateInPersonDialogProps {
  open: boolean
  onClose: () => void
  complexId: Id<'complexes'>
}

export function CreateInPersonDialog({
  open,
  onClose,
  complexId,
}: CreateInPersonDialogProps) {
  const [residentId, setResidentId] = useState('')
  const [categoryKey, setCategoryKey] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [description, setDescription] = useState('')

  const { data: residents } = useSuspenseQuery(
    convexQuery(api.residents.queries.listByComplex, { complexId }),
  )

  const { data: categories } = useSuspenseQuery(
    convexQuery(api.communications.queries.listCategories, { complexId }),
  )

  const createFn = useConvexMutation(
    api.communications.mutations.createInPersonTicket,
  )
  const createMut = useMutation({ mutationFn: createFn })

  const residentOptions: SearchableSelectOption[] = residents.map((r) => ({
    value: r._id,
    label: `${r.firstName} ${r.lastName}`,
    detail: r.unit ? `T${r.unit.tower}-${r.unit.number}` : undefined,
    searchAliases: [
      r.firstName.toLowerCase(),
      r.lastName.toLowerCase(),
      ...(r.unit ? [`t${r.unit.tower}`, r.unit.number] : []),
    ],
  }))

  const categoryOptions: SearchableSelectOption[] = categories.map((c) => ({
    value: c.key,
    label: c.label,
  }))

  const selectedResident = residents.find((r) => r._id === residentId)

  const resetForm = () => {
    setResidentId('')
    setCategoryKey('')
    setPriority('medium')
    setDescription('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!residentId || !categoryKey || !description.trim()) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (!selectedResident?.unitId) {
      toast.error('El residente no tiene unidad asignada')
      return
    }

    try {
      const result = await createMut.mutateAsync({
        complexId,
        residentId: residentId as Id<'residents'>,
        unitId: selectedResident.unitId,
        categories: [categoryKey],
        priority,
        initialDescription: description.trim(),
      })
      toast.success(`Ticket ${result.publicId} creado`)
      handleClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al crear ticket')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear ticket presencial</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Residente</FieldLabel>
              <SearchableSelect
                value={residentId}
                onValueChange={setResidentId}
                options={residentOptions}
                placeholder="Buscar residente..."
                searchPlaceholder="Nombre, torre o número..."
                emptyMessage="Sin resultados"
              />
            </Field>

            <Field>
              <FieldLabel>Categoría</FieldLabel>
              <SearchableSelect
                value={categoryKey}
                onValueChange={setCategoryKey}
                options={categoryOptions}
                placeholder="Seleccionar categoría..."
                searchPlaceholder="Buscar categoría..."
                emptyMessage="Sin categorías"
              />
            </Field>

            <Field>
              <FieldLabel>Prioridad</FieldLabel>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setPriority(v as 'high' | 'medium' | 'low')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Descripción</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa el caso reportado por el residente..."
                className="min-h-24"
              />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMut.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createMut.isPending ||
              !residentId ||
              !categoryKey ||
              !description.trim()
            }
          >
            {createMut.isPending ? 'Creando...' : 'Crear ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
