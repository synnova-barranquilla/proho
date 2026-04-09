import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
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
import { PlacaInput } from '#/components/ui/formatted-input'
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

type VehiculoTipo = 'CARRO' | 'MOTO' | 'OTRO'
type VehiculoRow = Doc<'vehiculos'> & { unidad: Doc<'unidades'> | null }

interface VehiculoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conjuntoId: Id<'conjuntos'>
  vehiculo: VehiculoRow | null
}

export function VehiculoDialog({
  open,
  onOpenChange,
  conjuntoId,
  vehiculo,
}: VehiculoDialogProps) {
  const isEdit = vehiculo !== null

  const [unidadId, setUnidadId] = useState<string>('')
  const [placa, setPlaca] = useState('')
  const [tipo, setTipo] = useState<VehiculoTipo>('CARRO')
  const [propietario, setPropietario] = useState('')

  useEffect(() => {
    if (open) {
      setUnidadId(vehiculo?.unidadId ?? '')
      setPlaca(vehiculo?.placa ?? '')
      setTipo((vehiculo?.tipo ?? 'CARRO') as VehiculoTipo)
      setPropietario(vehiculo?.propietarioNombre ?? '')
    }
  }, [open, vehiculo])

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )
  const unidades = unidadesData.torres.flatMap((t) => t.unidades)

  const createFn = useConvexMutation(api.vehiculos.mutations.create)
  const updateFn = useConvexMutation(api.vehiculos.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })
  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (vehiculo !== null) {
        await updateMut.mutateAsync({
          vehiculoId: vehiculo._id,
          placa,
          tipo,
          propietarioNombre: propietario || undefined,
        })
        toast.success('Vehículo actualizado')
      } else {
        if (!unidadId) {
          toast.error('Selecciona una unidad')
          return
        }
        await createMut.mutateAsync({
          unidadId: unidadId as Id<'unidades'>,
          placa,
          tipo,
          propietarioNombre: propietario || undefined,
        })
        toast.success('Vehículo creado')
      }
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar vehículo' : 'Nuevo vehículo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
            <FieldGroup>
              {!isEdit && (
                <Field>
                  <FieldLabel>Unidad</FieldLabel>
                  <Select
                    value={unidadId}
                    onValueChange={(v) => v && setUnidadId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una unidad">
                        {(value: string) => {
                          const u = unidades.find((x) => x._id === value)
                          return u ? `Torre ${u.torre} — ${u.numero}` : null
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          Torre {u.torre} — {u.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field>
                <FieldLabel>Placa</FieldLabel>
                <PlacaInput value={placa} onChange={setPlaca} required />
              </Field>
              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <Select
                  value={tipo}
                  onValueChange={(v) => v && setTipo(v as VehiculoTipo)}
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
                  placeholder="Nombre si no coincide con el residente principal"
                />
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
