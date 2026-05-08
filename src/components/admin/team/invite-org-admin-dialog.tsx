import { useCallback, useEffect, useState } from 'react'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Building2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
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
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

const authenticatedRoute = getRouteApi('/_authenticated')

const schema = z.object({
  email: z.string().trim().min(1, 'Requerido').email('Email no válido'),
  firstName: z
    .string()
    .trim()
    .min(1, 'Requerido')
    .max(40, 'Máximo 40 caracteres'),
  lastName: z
    .string()
    .trim()
    .max(40, 'Máximo 40 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

type FormInput = z.infer<typeof schema>

interface InviteOrgAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteOrgAdminDialog({
  open,
  onOpenChange,
}: InviteOrgAdminDialogProps) {
  const { organization } = authenticatedRoute.useLoaderData()
  const mutationFn = useConvexMutation(api.invitations.mutations.create)
  const mutation = useMutation({ mutationFn })

  // Local state for the two new pre-assignment controls. They live outside
  // the tanstack-form schema because they're not validated as form fields —
  // they're independent toggles passed straight to the mutation.
  const [makeOwner, setMakeOwner] = useState(false)
  const [selectedComplexIds, setSelectedComplexIds] = useState<
    Array<Id<'complexes'>>
  >([])

  // Complexes visible to the current owner. Used by the multi-select.
  // We only fetch them when the dialog is open.
  const complexesQuery = useQuery({
    ...convexQuery(api.complexes.queries.listForCurrentUser, {}),
    enabled: open,
  })
  const complexes = complexesQuery.data ?? []

  const form = useForm({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: undefined,
    } as FormInput,
    validators: {
      onBlur: schema,
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          organizationId: organization._id,
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
            ? `${value.email} fue invitado como owner. Verá todos los conjuntos al aceptar.`
            : selectedComplexIds.length > 0
              ? `${value.email} fue invitado con acceso a ${selectedComplexIds.length} conjunto(s).`
              : `${value.email} fue invitado como ADMIN. Podrás asignarle conjuntos después de que acepte.`,
        })
        form.reset()
        setMakeOwner(false)
        setSelectedComplexIds([])
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

  useEffect(() => {
    if (open) {
      form.reset({ email: '', firstName: '', lastName: undefined })
      setMakeOwner(false)
      setSelectedComplexIds([])
    }
  }, [open])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        form.reset()
        setMakeOwner(false)
        setSelectedComplexIds([])
      }
      onOpenChange(next)
    },
    [form, onOpenChange],
  )

  const toggleComplex = (id: Id<'complexes'>) => {
    setSelectedComplexIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Invitar administrador</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            El nuevo admin entrará a {organization.name}. Puedes marcarlo como
            owner o pre-asignarle conjuntos específicos en este mismo paso.
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

              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Owner de la organización</FieldLabel>
                  <FieldDescription>
                    Si está activo, el nuevo admin verá todos los conjuntos
                    automáticamente y podrá invitar otros admins. Las
                    pre-asignaciones de conjuntos se ignoran.
                  </FieldDescription>
                </div>
                <Switch checked={makeOwner} onCheckedChange={setMakeOwner} />
              </Field>

              {!makeOwner ? (
                <Field>
                  <FieldLabel>
                    Acceso a conjuntos{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({selectedComplexIds.length} seleccionado
                      {selectedComplexIds.length === 1 ? '' : 's'})
                    </span>
                  </FieldLabel>
                  <FieldDescription>
                    Selecciona los conjuntos a los que el nuevo admin tendrá
                    acceso desde el momento en que acepte. Puedes dejarlo vacío
                    y asignárselos después.
                  </FieldDescription>
                  <ComplexMultiSelect
                    complexes={complexes}
                    selectedIds={selectedComplexIds}
                    onToggle={toggleComplex}
                    isLoading={complexesQuery.isLoading}
                  />
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

function ComplexMultiSelect({
  complexes,
  selectedIds,
  onToggle,
  isLoading,
}: {
  complexes: Array<Doc<'complexes'>>
  selectedIds: Array<Id<'complexes'>>
  onToggle: (id: Id<'complexes'>) => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
        Cargando conjuntos…
      </div>
    )
  }

  if (complexes.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
        No hay conjuntos en la organización aún.
      </div>
    )
  }

  return (
    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md border p-2">
      {complexes.map((c) => {
        const isSelected = selectedIds.includes(c._id)
        return (
          <button
            key={c._id}
            type="button"
            onClick={() => onToggle(c._id)}
            className={cn(
              'flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
              isSelected
                ? 'border-primary/50 bg-primary/5'
                : 'border-border hover:bg-accent/50',
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border',
              )}
            >
              {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
            </div>
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{c.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {c.address}, {c.city}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
