import { useCallback, useEffect, useState } from 'react'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
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
import { Skeleton } from '#/components/ui/skeleton'
import { Switch } from '#/components/ui/switch'
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

  const [makeOwner, setMakeOwner] = useState(false)
  const [selectedComplexIds, setSelectedConjuntoIds] = useState<
    Array<Id<'complexes'>>
  >([])

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

  // Conjuntos for the selected org (super admin sees all).
  const complexesQuery = useQuery({
    ...convexQuery(api.complexes.queries.listAllForSuperAdmin, {}),
    enabled: open,
  })

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
          isOrgOwnerOnAccept: makeOwner || undefined,
          complexIdsOnAccept:
            !makeOwner && selectedComplexIds.length > 0
              ? selectedComplexIds
              : undefined,
        })
        toast.success('Invitación creada', {
          description: makeOwner
            ? `Se invitó a ${value.email} como ADMIN owner.`
            : `Se invitó a ${value.email} como ADMIN.`,
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
      setMakeOwner(false)
      setSelectedConjuntoIds([])
    }
  }, [open, initialOrgId])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) form.reset()
      onOpenChange(next)
    },
    [form, onOpenChange],
  )

  // When initialOrgId is set the org is fixed; otherwise read from form state.
  const currentOrgId =
    initialOrgId ?? (form.state.values.organizationId || undefined)
  const orgComplexes = (complexesQuery.data ?? []).filter(
    (c) => c.organizationId === currentOrgId && c.active,
  )

  const selectedOrg = initialOrgId
    ? (invitableOrgs.find((o) => o._id === initialOrgId) ?? null)
    : null

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Invitar administrador</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            El invitado recibirá acceso como ADMIN de la organización cuando
            inicie sesión por primera vez.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ResponsiveDialogBody>
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
                        <SearchableSelect
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v)}
                          options={invitableOrgs.map((org) => ({
                            value: org._id,
                            label: org.name,
                          }))}
                          placeholder="Selecciona una organización"
                          searchPlaceholder="Buscar organización..."
                        />
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

              <div className="flex items-center gap-3 rounded-md border p-3">
                <Switch
                  id="makeOwner"
                  checked={makeOwner}
                  onCheckedChange={(checked) => {
                    setMakeOwner(checked)
                    if (checked) setSelectedConjuntoIds([])
                  }}
                />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="makeOwner" className="text-sm font-medium">
                    Es owner de la organización
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Los owners ven todos los conjuntos automáticamente.
                  </span>
                </div>
              </div>

              {!makeOwner && orgComplexes.length > 0 ? (
                <Field>
                  <FieldLabel>Conjuntos a asignar</FieldLabel>
                  <FieldDescription>
                    Selecciona los conjuntos a los que tendrá acceso.
                  </FieldDescription>
                  <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
                    {orgComplexes.map((c) => {
                      const selected = selectedComplexIds.includes(c._id)
                      return (
                        <Badge
                          key={c._id}
                          variant={selected ? 'default' : 'outline'}
                          className="cursor-pointer select-none"
                          onClick={() =>
                            setSelectedConjuntoIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== c._id)
                                : [...prev, c._id],
                            )
                          }
                        >
                          {c.name}
                        </Badge>
                      )
                    })}
                  </div>
                </Field>
              ) : null}
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
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
