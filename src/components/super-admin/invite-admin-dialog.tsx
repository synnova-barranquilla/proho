import { useCallback, useEffect } from 'react'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import { isInternalOrgSlug } from '#/lib/organizations'
import {
  inviteAdminSchema,
  type InviteAdminInput,
} from '#/lib/schemas/organization'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface InviteAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * If defined, the org is pre-selected and the picker is hidden.
   * If undefined, the dialog shows an org picker.
   */
  initialOrgId?: Id<'organizations'>
}

export function InviteAdminDialog({
  open,
  onOpenChange,
  initialOrgId,
}: InviteAdminDialogProps) {
  const mutationFn = useConvexMutation(api.invitations.mutations.create)
  const mutation = useMutation({ mutationFn })

  // Only fetch the orgs list if we need to show the picker.
  const orgsQuery = useQuery({
    ...convexQuery(api.organizations.queries.listAll, {
      includeInactive: false,
    }),
    enabled: open && !initialOrgId,
  })

  const invitableOrgs = (orgsQuery.data ?? []).filter(
    (o) => o.active && !isInternalOrgSlug(o.slug),
  )

  const defaultValues: InviteAdminInput = {
    organizationId: initialOrgId ?? '',
    email: '',
    firstName: '',
    lastName: undefined,
  }

  const form = useForm({
    defaultValues,
    validators: {
      onBlur: inviteAdminSchema,
      onChange: inviteAdminSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          organizationId: value.organizationId as Id<'organizations'>,
          email: value.email,
          firstName: value.firstName,
          lastName: value.lastName,
          orgRole: 'ADMIN',
        })
        toast.success('Invitación creada', {
          description: `Se invitó a ${value.email} como ADMIN.`,
        })
        form.reset()
        onOpenChange(false)
      } catch (err) {
        if (err instanceof ConvexError) {
          const data = err.data as { message?: string }
          toast.error(data.message ?? 'Error al crear invitación')
        } else {
          toast.error('Error inesperado')
        }
      }
    },
  })

  // Reset form when reopening for a different initialOrgId.
  useEffect(() => {
    if (open) {
      form.reset({
        organizationId: initialOrgId ?? '',
        email: '',
        firstName: '',
        lastName: undefined,
      })
    }
  }, [open, initialOrgId])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) form.reset()
      onOpenChange(next)
    },
    [form, onOpenChange],
  )

  const selectedOrg = initialOrgId
    ? (invitableOrgs.find((o) => o._id === initialOrgId) ?? null)
    : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar administrador</DialogTitle>
          <DialogDescription>
            El invitado recibirá acceso como ADMIN de la organización cuando
            inicie sesión por primera vez.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody>
            <FieldGroup>
              {initialOrgId ? (
                selectedOrg && (
                  <div className="rounded-md bg-muted px-3 py-2 text-sm">
                    Invitando para{' '}
                    <strong className="font-medium">{selectedOrg.name}</strong>
                  </div>
                )
              ) : (
                <form.Field name="organizationId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Organización</FieldLabel>
                      {orgsQuery.isLoading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <Select
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v ?? '')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una organización" />
                          </SelectTrigger>
                          <SelectContent>
                            {invitableOrgs.map((org) => (
                              <SelectItem key={org._id} value={org._id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FieldError
                        errors={
                          field.state.meta.isTouched
                            ? (field.state.meta.errors as Array<{
                                message?: string
                              }>)
                            : undefined
                        }
                      />
                    </Field>
                  )}
                </form.Field>
              )}

              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="admin@ejemplo.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError
                      errors={
                        field.state.meta.isTouched
                          ? (field.state.meta.errors as Array<{
                              message?: string
                            }>)
                          : undefined
                      }
                    />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="firstName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Nombre</FieldLabel>
                      <Input
                        placeholder="Juan"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={
                          field.state.meta.isTouched
                            ? (field.state.meta.errors as Array<{
                                message?: string
                              }>)
                            : undefined
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Apellido</FieldLabel>
                      <Input
                        placeholder="Pérez"
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value || undefined)
                        }
                      />
                      <FieldDescription>Opcional</FieldDescription>
                      <FieldError
                        errors={
                          field.state.meta.isTouched
                            ? (field.state.meta.errors as Array<{
                                message?: string
                              }>)
                            : undefined
                        }
                      />
                    </Field>
                  )}
                </form.Field>
              </div>
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
