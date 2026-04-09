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
import { DocumentInput, PhoneInput } from '#/components/ui/formatted-input'
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

type TipoDoc = 'CC' | 'CE' | 'PA'
type ResidenteTipo = 'PROPIETARIO' | 'ARRENDATARIO' | 'FAMILIAR'
type ResidenteRow = Doc<'residentes'> & { unidad: Doc<'unidades'> | null }

interface ResidenteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conjuntoId: Id<'conjuntos'>
  residente: ResidenteRow | null
}

export function ResidenteDialog({
  open,
  onOpenChange,
  conjuntoId,
  residente,
}: ResidenteDialogProps) {
  const isEdit = residente !== null

  const [unidadId, setUnidadId] = useState<string>('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [tipoDoc, setTipoDoc] = useState<TipoDoc>('CC')
  const [numeroDoc, setNumeroDoc] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<ResidenteTipo>('PROPIETARIO')

  useEffect(() => {
    if (open) {
      setUnidadId(residente?.unidadId ?? '')
      setNombres(residente?.nombres ?? '')
      setApellidos(residente?.apellidos ?? '')
      setTipoDoc((residente?.tipoDocumento ?? 'CC') as TipoDoc)
      setNumeroDoc(residente?.numeroDocumento ?? '')
      setTelefono(residente?.telefono ?? '')
      setEmail(residente?.email ?? '')
      setTipo((residente?.tipo ?? 'PROPIETARIO') as ResidenteTipo)
    }
  }, [open, residente])

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )
  const unidades = unidadesData.torres.flatMap((t) => t.unidades)

  const createFn = useConvexMutation(api.residentes.mutations.create)
  const updateFn = useConvexMutation(api.residentes.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })
  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (residente !== null) {
        await updateMut.mutateAsync({
          residenteId: residente._id,
          nombres,
          apellidos,
          telefono: telefono || undefined,
          email: email || undefined,
          tipo,
        })
        toast.success('Residente actualizado')
      } else {
        if (!unidadId) {
          toast.error('Selecciona una unidad')
          return
        }
        await createMut.mutateAsync({
          unidadId: unidadId as Id<'unidades'>,
          nombres,
          apellidos,
          tipoDocumento: tipoDoc,
          numeroDocumento: numeroDoc,
          telefono: telefono || undefined,
          email: email || undefined,
          tipo,
        })
        toast.success('Residente creado')
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar residente' : 'Nuevo residente'}
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
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Nombres</FieldLabel>
                  <Input
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    required
                  />
                </Field>
              </div>
              {!isEdit && (
                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Tipo doc.</FieldLabel>
                    <Select
                      value={tipoDoc}
                      onValueChange={(v) => v && setTipoDoc(v as TipoDoc)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC">CC</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="PA">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="col-span-2">
                    <FieldLabel>Número de documento</FieldLabel>
                    <DocumentInput
                      value={numeroDoc}
                      onChange={setNumeroDoc}
                      required
                    />
                  </Field>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Teléfono</FieldLabel>
                  <PhoneInput value={telefono} onChange={setTelefono} />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <Select
                  value={tipo}
                  onValueChange={(v) => v && setTipo(v as ResidenteTipo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                    <SelectItem value="ARRENDATARIO">Arrendatario</SelectItem>
                    <SelectItem value="FAMILIAR">Familiar</SelectItem>
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
