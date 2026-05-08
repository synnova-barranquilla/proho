import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { DocumentInput, PhoneInput } from '#/components/ui/formatted-input'
import { Input } from '#/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '#/components/ui/responsive-dialog'
import { SearchableSelect } from '#/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { buildUnitOptions } from '#/lib/unit-search'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import type {
  DocumentType,
  ResidentType,
} from '../../../../convex/residents/validators'

type ResidentRow = Doc<'residents'> & { unit: Doc<'units'> | null }

interface ResidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  resident: ResidentRow | null
}

export function ResidentDialog({
  open,
  onOpenChange,
  complexId,
  resident,
}: ResidentDialogProps) {
  const isEdit = resident !== null

  const [unitId, setUnitId] = useState<string>('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [docType, setDocType] = useState<DocumentType>('CC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [residentType, setResidentType] = useState<ResidentType>('OWNER')

  useEffect(() => {
    if (open) {
      setUnitId(resident?.unitId ?? '')
      setFirstName(resident?.firstName ?? '')
      setLastName(resident?.lastName ?? '')
      setDocType((resident?.documentType ?? 'CC') as DocumentType)
      setDocumentNumber(resident?.documentNumber ?? '')
      setPhone(resident?.phone ?? '')
      setEmail(resident?.email ?? '')
      setResidentType((resident?.type ?? 'OWNER') as ResidentType)
    }
  }, [open, resident])

  const { data: unitsData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const units = unitsData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unitOptions = buildUnitOptions(units)

  const createFn = useConvexMutation(api.residents.mutations.create)
  const updateFn = useConvexMutation(api.residents.mutations.update)
  const createMut = useMutation({ mutationFn: createFn })
  const updateMut = useMutation({ mutationFn: updateFn })
  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (resident !== null) {
        await updateMut.mutateAsync({
          residentId: resident._id,
          firstName,
          lastName,
          phone: phone || undefined,
          email: email || undefined,
          type: residentType,
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
          documentType: docType,
          documentNumber,
          phone: phone || undefined,
          email: email || undefined,
          type: residentType,
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEdit ? 'Editar residente' : 'Nuevo residente'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ResponsiveDialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Unidad</FieldLabel>
                <SearchableSelect
                  value={unitId}
                  onValueChange={setUnitId}
                  options={unitOptions}
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
                      value={docType}
                      onValueChange={(v) => v && setDocType(v as DocumentType)}
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
                  value={residentType}
                  onValueChange={(v) => v && setResidentType(v as ResidentType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo">
                      {
                        {
                          OWNER: 'Propietario',
                          LESSEE: 'Arrendatario',
                          TENANT: 'Inquilino',
                        }[residentType]
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
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              render={<Button variant="outline">Cancelar</Button>}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
