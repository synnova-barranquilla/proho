import { useCallback, useEffect } from 'react'

import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
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
import { updateOrgSchema } from '#/lib/schemas/organization'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

interface OrgEditNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: Doc<'organizations'>
}

export function OrgEditNameDialog({
  open,
  onOpenChange,
  org,
}: OrgEditNameDialogProps) {
  const mutationFn = useConvexMutation(api.organizations.mutations.update)
  const mutation = useMutation({ mutationFn })

  const form = useForm({
    defaultValues: { name: org.name },
    validators: {
      onBlur: updateOrgSchema,
      onChange: updateOrgSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({ orgId: org._id, name: value.name })
        toast.success('Nombre actualizado')
        onOpenChange(false)
      } catch (err) {
        if (err instanceof ConvexError) {
          const data = err.data as { message?: string }
          toast.error(data.message ?? 'Error al actualizar el nombre')
        } else {
          toast.error('Error inesperado')
        }
      }
    },
  })

  // Re-sync the form when opening for a different org.
  useEffect(() => {
    if (open) {
      form.reset({ name: org.name })
    }
  }, [open, org._id])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) form.reset()
      onOpenChange(next)
    },
    [form, onOpenChange],
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar nombre</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Solo el nombre puede cambiar. El slug de la organización es
            permanente.
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
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>Nombre</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoFocus
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
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              render={<Button variant="outline">Cancelar</Button>}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
