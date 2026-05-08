import { useCallback, useState } from 'react'

import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

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
import { Switch } from '#/components/ui/switch'
import { MODULE_DESCRIPTIONS, MODULE_LABELS } from '#/lib/modules'
import {
  onboardTenantSchema,
  type OnboardTenantInput,
} from '#/lib/schemas/organization'
import { slugify } from '#/lib/slug'
import { api } from '../../../convex/_generated/api'

interface OrgCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_VALUES: OnboardTenantInput = {
  name: '',
  slug: '',
  activeModules: [],
  adminEmail: '',
  adminFirstName: '',
  adminLastName: undefined,
}

export function OrgCreateDialog({ open, onOpenChange }: OrgCreateDialogProps) {
  const navigate = useNavigate()
  const [slugTouched, setSlugTouched] = useState(false)

  const mutationFn = useConvexMutation(
    api.organizations.mutations.onboardTenant,
  )
  const mutation = useMutation({ mutationFn })

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onBlur: onboardTenantSchema,
      onChange: onboardTenantSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await mutation.mutateAsync({
          slug: value.slug,
          name: value.name,
          activeModules: value.activeModules,
          adminEmail: value.adminEmail,
          adminFirstName: value.adminFirstName,
          adminLastName: value.adminLastName,
        })
        toast.success('Organización creada', {
          description: `Se envió la invitación a ${value.adminEmail}.`,
        })
        onOpenChange(false)
        form.reset()
        setSlugTouched(false)
        void navigate({
          to: '/super-admin/organizaciones/$orgId',
          params: { orgId: result.orgId },
        })
      } catch (err) {
        if (err instanceof ConvexError) {
          const data = err.data as { code?: string; message?: string }
          const message = data.message ?? 'Error al crear organización'
          toast.error(message)
        } else {
          toast.error('Error inesperado al crear organización')
        }
      }
    },
  })

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        form.reset()
        setSlugTouched(false)
      }
      onOpenChange(next)
    },
    [form, onOpenChange],
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nueva organización</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Crea una organización e invita a su administrador inicial en una
            sola acción.
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
          <ResponsiveDialogBody className="space-y-4">
            <FieldGroup>
              <form.Field name="name">
                {(field) => (
                  <Field>
                    <FieldLabel>Nombre de la organización</FieldLabel>
                    <Input
                      placeholder="Conjunto Altos del Prado"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const nextName = e.target.value
                        field.handleChange(nextName)
                        if (!slugTouched) {
                          form.setFieldValue('slug', slugify(nextName))
                        }
                      }}
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

              <form.Field name="slug">
                {(field) => (
                  <Field>
                    <FieldLabel>Slug</FieldLabel>
                    <Input
                      className="font-mono text-sm"
                      placeholder="altos-del-prado"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        setSlugTouched(true)
                        field.handleChange(e.target.value)
                      }}
                    />
                    <FieldDescription>
                      Identificador único de la organización. Se genera
                      automáticamente desde el nombre.
                    </FieldDescription>
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

              <form.Field name="activeModules">
                {(field) => (
                  <Field>
                    <FieldLabel>Módulos activos</FieldLabel>
                    <div className="space-y-2">
                      {(
                        [
                          'access_control',
                          'communications',
                          'reservas',
                        ] as const
                      ).map((key) => {
                        const isActive = field.state.value.includes(key)
                        return (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-4 rounded-md border p-3"
                          >
                            <div className="flex-1 space-y-0.5">
                              <Label className="text-sm font-medium">
                                {MODULE_LABELS[key]}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {MODULE_DESCRIPTIONS[key]}
                              </p>
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={(checked) => {
                                const current = field.state.value
                                field.handleChange(
                                  checked === true
                                    ? [...current, key]
                                    : current.filter((m) => m !== key),
                                )
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium">Administrador inicial</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Se creará una invitación pendiente para este usuario.
              </p>
            </div>

            <FieldGroup>
              <form.Field name="adminEmail">
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
                <form.Field name="adminFirstName">
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

                <form.Field name="adminLastName">
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
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              render={<Button variant="outline">Cancelar</Button>}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creando...' : 'Crear organización'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
