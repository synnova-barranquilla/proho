import { useEffect, useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { NumberInput } from '#/components/ui/number-input'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { api } from '../../../../../../convex/_generated/api'

export const Route = createFileRoute(
  '/_authenticated/c/$conjuntoId/parqueaderos/configurar',
)({
  component: ConfigurarParqueaderosPage,
})

function ConfigurarParqueaderosPage() {
  const { conjuntoId, conjuntoSlug } = Route.useRouteContext()
  const navigate = useNavigate()
  const isAdmin = useIsConjuntoAdmin()

  // Client-side guard: non-admins should never reach this page. The
  // backend mutation already rejects them, but we kick them out of the
  // UI before they even see the form. Happens in an effect so we don't
  // call navigate during render.
  useEffect(() => {
    if (!isAdmin) {
      void navigate({
        to: '/c/$conjuntoId',
        params: { conjuntoId: conjuntoSlug },
      })
    }
  }, [isAdmin, navigate, conjuntoSlug])

  const [residentes, setResidentes] = useState(0)
  const [visitantes, setVisitantes] = useState(0)
  const [motos, setMotos] = useState(0)
  const [discapacitados, setDiscapacitados] = useState(0)

  if (!isAdmin) return null

  const bulkFn = useConvexMutation(api.parqueaderos.mutations.bulkGenerate)
  const bulkMut = useMutation({ mutationFn: bulkFn })

  const total = residentes + visitantes + motos + discapacitados

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (total === 0) {
      toast.error('Indica al menos una cantidad mayor a 0')
      return
    }
    try {
      const res = await bulkMut.mutateAsync({
        conjuntoId,
        residentes,
        visitantes,
        motos,
        discapacitados,
      })
      toast.success(`${res.created} parqueaderos creados`)
      navigate({
        to: '/c/$conjuntoId/parqueaderos',
        params: { conjuntoId: conjuntoSlug },
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
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Configurar parqueaderos en bulk</CardTitle>
          <CardDescription>
            Indica cuántos parqueaderos crear por tipo. El sistema los numerará
            automáticamente (ej. R-001, V-001, M-001, D-001). Este formulario es
            aditivo: puedes ejecutarlo varias veces para agregar más.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Residentes"
                  description="Prefijo R-"
                  value={residentes}
                  onChange={setResidentes}
                />
                <NumberField
                  label="Visitantes"
                  description="Prefijo V-"
                  value={visitantes}
                  onChange={setVisitantes}
                />
                <NumberField
                  label="Motos"
                  description="Prefijo M-"
                  value={motos}
                  onChange={setMotos}
                />
                <NumberField
                  label="Discapacitados"
                  description="Prefijo D-"
                  value={discapacitados}
                  onChange={setDiscapacitados}
                />
              </div>
            </FieldGroup>

            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
              <span>Total a crear</span>
              <span className="font-semibold">{total}</span>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: '/c/$conjuntoId/parqueaderos',
                    params: { conjuntoId: conjuntoSlug },
                  })
                }
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={bulkMut.isPending || total === 0}>
                {bulkMut.isPending
                  ? 'Creando...'
                  : `Crear ${total} parqueaderos`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function NumberField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <NumberInput min={0} value={value} onChange={(v) => onChange(v ?? 0)} />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  )
}
