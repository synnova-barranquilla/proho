import { useEffect, useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useConvexMutation } from '@convex-dev/react-query'
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
import { Input } from '#/components/ui/input'
import { api } from '../../../convex/_generated/api'

/**
 * Slugify a human-readable string into a conjunto slug:
 * lowercase, ASCII only, spaces → dashes, strips non-[a-z0-9-], collapses
 * consecutive dashes and trims leading/trailing dashes.
 */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

interface CreateConjuntoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateConjuntoDialog({
  open,
  onOpenChange,
}: CreateConjuntoDialogProps) {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')

  // Auto-derive slug from nombre until the user edits it manually.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nombre))
  }, [nombre, slugTouched])

  useEffect(() => {
    if (!open) {
      setNombre('')
      setSlug('')
      setSlugTouched(false)
      setDireccion('')
      setCiudad('')
    }
  }, [open])

  const createFn = useConvexMutation(api.conjuntos.mutations.create)
  const createMut = useMutation({ mutationFn: createFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMut.mutateAsync({ slug, nombre, direccion, ciudad })
      toast.success('Conjunto creado')
      onOpenChange(false)
      void navigate({
        to: '/c/$conjuntoSlug',
        params: { conjuntoSlug: slug },
      })
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear conjunto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Altos del Prado"
                  required
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel>Slug (URL)</FieldLabel>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder="altos-del-prado"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Dirección</FieldLabel>
                <Input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Carrera 53 #80-15"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Ciudad</FieldLabel>
                <Input
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Barranquilla"
                  required
                />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
