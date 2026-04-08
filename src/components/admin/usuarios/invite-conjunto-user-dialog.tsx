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
  DialogDescription,
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
import type { Id } from '../../../../convex/_generated/dataModel'

type ConjuntoRole = 'ASISTENTE' | 'VIGILANTE' | 'RESIDENTE'

interface InviteConjuntoUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conjuntoId: Id<'conjuntos'>
}

export function InviteConjuntoUserDialog({
  open,
  onOpenChange,
  conjuntoId,
}: InviteConjuntoUserDialogProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<ConjuntoRole>('VIGILANTE')

  useEffect(() => {
    if (open) {
      setEmail('')
      setFirstName('')
      setLastName('')
      setRole('VIGILANTE')
    }
  }, [open])

  const mutationFn = useConvexMutation(api.invitations.mutations.create)
  const mutation = useMutation({ mutationFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutation.mutateAsync({
        email,
        firstName,
        lastName: lastName || undefined,
        conjuntoId,
        conjuntoRole: role,
      })
      toast.success('Invitación enviada', {
        description: `${email} recibirá acceso como ${role} al aceptar.`,
      })
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario al conjunto</DialogTitle>
          <DialogDescription>
            El invitado recibirá acceso con el rol seleccionado cuando inicie
            sesión por primera vez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
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
              <Field>
                <FieldLabel>Rol en el conjunto</FieldLabel>
                <Select
                  value={role}
                  onValueChange={(v) => v && setRole(v as ConjuntoRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIGILANTE">Vigilante</SelectItem>
                    <SelectItem value="ASISTENTE">Asistente</SelectItem>
                    <SelectItem value="RESIDENTE">Residente</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enviando...' : 'Invitar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
