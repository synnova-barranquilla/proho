import { Suspense, useEffect, useState } from 'react'

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
  ResponsiveDialogDescription,
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
import { Skeleton } from '#/components/ui/skeleton'
import type { ComplexRole } from '#/lib/complex-role'
import { buildUnitOptions } from '#/lib/unit-search'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import type { DocumentType } from '../../../../convex/residents/validators'

type InvitableComplexRole = Extract<
  ComplexRole,
  'GUARD' | 'OWNER' | 'TENANT' | 'LESSEE'
>

const RESIDENT_ROLES: InvitableComplexRole[] = ['OWNER', 'TENANT', 'LESSEE']

interface InviteComplexUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
}

export function InviteComplexUserDialog({
  open,
  onOpenChange,
  complexId,
}: InviteComplexUserDialogProps) {
  const [role, setRole] = useState<InvitableComplexRole>('GUARD')

  useEffect(() => {
    if (open) setRole('GUARD')
  }, [open])

  const isResident = RESIDENT_ROLES.includes(role)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Invitar usuario al conjunto
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isResident
              ? 'Se creará el registro de residente y se enviará la invitación por email.'
              : 'El invitado recibirá acceso con el rol seleccionado cuando inicie sesión por primera vez.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {isResident ? (
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ResidentInviteForm
              complexId={complexId}
              role={role}
              onRoleChange={setRole}
              onClose={() => onOpenChange(false)}
            />
          </Suspense>
        ) : (
          <StaffInviteForm
            complexId={complexId}
            role={role}
            onRoleChange={setRole}
            onClose={() => onOpenChange(false)}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function RoleSelect({
  value,
  onChange,
}: {
  value: InvitableComplexRole
  onChange: (v: InvitableComplexRole) => void
}) {
  return (
    <Field>
      <FieldLabel>Rol en el conjunto</FieldLabel>
      <Select
        value={value}
        onValueChange={(v) => v && onChange(v as InvitableComplexRole)}
      >
        <SelectTrigger>
          <SelectValue>
            {
              {
                GUARD: 'Vigilante',
                OWNER: 'Propietario',
                TENANT: 'Inquilino',
                LESSEE: 'Arrendatario',
              }[value]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="GUARD">Vigilante</SelectItem>
          <SelectItem value="OWNER">Propietario</SelectItem>
          <SelectItem value="TENANT">Inquilino</SelectItem>
          <SelectItem value="LESSEE">Arrendatario</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  )
}

function StaffInviteForm({
  complexId,
  role,
  onRoleChange,
  onClose,
}: {
  complexId: Id<'complexes'>
  role: InvitableComplexRole
  onRoleChange: (r: InvitableComplexRole) => void
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const mutationFn = useConvexMutation(api.invitations.mutations.create)
  const mutation = useMutation({ mutationFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutation.mutateAsync({
        email,
        firstName,
        lastName: lastName || undefined,
        complexId,
        complexRole: role,
      })
      toast.success('Invitación enviada', {
        description: `${email} recibirá acceso como ${role} al aceptar.`,
      })
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al crear invitación')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <ResponsiveDialogBody>
        <FieldGroup>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vigilante@ejemplo.com"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Apellido</FieldLabel>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>
          </div>
          <RoleSelect value={role} onChange={onRoleChange} />
        </FieldGroup>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <ResponsiveDialogClose
          render={<Button variant="outline">Cancelar</Button>}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando...' : 'Invitar'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}

function ResidentInviteForm({
  complexId,
  role,
  onRoleChange,
  onClose,
}: {
  complexId: Id<'complexes'>
  role: InvitableComplexRole
  onRoleChange: (r: InvitableComplexRole) => void
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [unitId, setUnitId] = useState('')
  const [docType, setDocType] = useState<DocumentType>('CC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [phone, setPhone] = useState('')

  const { data: unitsData } = useSuspenseQuery(
    convexQuery(api.units.queries.listByComplex, { complexId }),
  )
  const units = unitsData.towers.flatMap(
    (t: { units: Array<{ _id: string; tower: string; number: string }> }) =>
      t.units,
  )
  const unitOptions = buildUnitOptions(units)

  const createFn = useConvexMutation(api.residents.mutations.create)
  const createMut = useMutation({ mutationFn: createFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitId) {
      toast.error('Selecciona una unidad')
      return
    }
    if (!email) {
      toast.error('El email es obligatorio para enviar la invitación')
      return
    }
    try {
      await createMut.mutateAsync({
        unitId: unitId as Id<'units'>,
        firstName,
        lastName,
        documentType: docType,
        documentNumber,
        phone: phone || undefined,
        email,
        type: role as 'OWNER' | 'TENANT' | 'LESSEE',
      })
      toast.success('Residente creado e invitación enviada', {
        description: `${email} recibirá acceso como ${role} al aceptar.`,
      })
      onClose()
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al crear residente')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <ResponsiveDialogBody>
        <FieldGroup>
          <RoleSelect value={role} onChange={onRoleChange} />
          <Field>
            <FieldLabel>Unidad</FieldLabel>
            <SearchableSelect
              value={unitId}
              onValueChange={setUnitId}
              options={unitOptions}
              placeholder="Selecciona una unidad"
              searchPlaceholder="Buscar por torre o número..."
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
                placeholder="residente@ejemplo.com"
                required
              />
            </Field>
          </div>
        </FieldGroup>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <ResponsiveDialogClose
          render={<Button variant="outline">Cancelar</Button>}
        />
        <Button type="submit" disabled={createMut.isPending}>
          {createMut.isPending ? 'Creando...' : 'Crear e invitar'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
