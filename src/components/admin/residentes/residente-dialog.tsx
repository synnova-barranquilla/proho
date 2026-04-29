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
import { SearchableSelect } from '#/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { buildUnidadOptions } from '#/lib/unidad-search'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

type TipoDoc = 'CC' | 'CE' | 'PA'
type ResidenteTipo = 'OWNER' | 'LESSEE' | 'TENANT'
type ResidenteRow = Doc<'residents'> & { unit: Doc<'units'> | null }

interface ResidenteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  residente: ResidenteRow | null
}

export function ResidenteDialog({
  open,
  onOpenChange,
  complexId,
  residente,
}: ResidenteDialogProps) {
  const isEdit = residente !== null

  const [unitId, setUnitId] = useState<string>('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [tipoDoc, setTipoDoc] = useState<TipoDoc>('CC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<ResidenteTipo>('OWNER')

  useEffect(() => {
    if (open) {
      setUnitId(residente?.unitId ?? '')
      setFirstName(residente?.firstName ?? '')
      setLastName(residente?.lastName ?? '')
      setTipoDoc((residente?.documentType ?? 'CC') as TipoDoc)
      setDocumentNumber(residente?.documentNumber ?? '')
      setPhone(residente?.phone ?? '')
      setEmail(residente?.email ?? '')
      setTipo((residente?.type ?? 'OWNER') as ResidenteTipo)
    }
  }, [open, residente])

  const { data: unidadesData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const unidades = unidadesData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unidadOptions = buildUnidadOptions(unidades)

  const createFn = useConvexMutation(api.residents.mutations.create)
  const updateFn = useConvexMutation(api.residents.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })
  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (residente !== null) {
        await updateMut.mutateAsync({
          residentId: residente._id,
          firstName,
          lastName,
          phone: phone || undefined,
          email: email || undefined,
          type: tipo,
        })
        toast.success('Residente actualizado')
      } else {
        if (!unitId) {
          toast.error('Selecciona una unidad')
          return
        }
        await createMut.mutateAsync({
          unitId: unitId as Id<'units'>,
          firstName,
          lastName,
          documentType: tipoDoc,
          documentNumber,
          phone: phone || undefined,
          email: email || undefined,
          type: tipo,
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
              <Field>
                <FieldLabel>Unidad</FieldLabel>
                <SearchableSelect
                  value={unitId}
                  onValueChange={setUnitId}
                  options={unidadOptions}
                  placeholder="Selecciona una unidad"
                  searchPlaceholder="Buscar por torre o número..."
                  disabled={isEdit}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Nombres</FieldLabel>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                      value={documentNumber}
                      onChange={setDocumentNumber}
                      required
                    />
                  </Field>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Teléfono</FieldLabel>
                  <PhoneInput value={phone} onChange={setPhone} />
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
                    <SelectValue placeholder="Selecciona tipo">
                      {
                        {
                          OWNER: 'Propietario',
                          LESSEE: 'Arrendatario',
                          TENANT: 'Inquilino',
                        }[tipo]
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Propietario</SelectItem>
                    <SelectItem value="LESSEE">Arrendatario</SelectItem>
                    <SelectItem value="TENANT">Inquilino</SelectItem>
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
