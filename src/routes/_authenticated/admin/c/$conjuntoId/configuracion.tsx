import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
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
import { Switch } from '#/components/ui/switch'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/configuracion',
)({
  loader: async ({ context: { queryClient, conjuntoId } }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.conjuntoConfig.queries.getByConjunto,
      { conjuntoId },
    )
    return null
  },
  component: ConfiguracionPage,
})

function ConfiguracionPage() {
  const { conjuntoId } = Route.useRouteContext()
  const navigate = useNavigate()
  const isAdmin = useIsConjuntoAdmin()

  // Client-side guard: only admins can see/edit conjunto config. The
  // backend mutation rejects non-admins too, but we skip rendering the
  // form entirely to avoid exposing sensitive configuration values.
  useEffect(() => {
    if (!isAdmin) {
      void navigate({
        to: '/admin/c/$conjuntoId',
        params: { conjuntoId },
      })
    }
  }, [isAdmin, navigate, conjuntoId])

  const { data: config } = useSuspenseQuery(
    convexQuery(api.conjuntoConfig.queries.getByConjunto, {
      conjuntoId,
    }),
  )

  const [reglaIngresoEnMora, setReglaIngresoEnMora] = useState(
    config?.reglaIngresoEnMora ?? true,
  )
  const [reglaVehiculoDuplicado, setReglaVehiculoDuplicado] = useState(
    config?.reglaVehiculoDuplicado ?? true,
  )
  const [reglaPermanenciaMaxDias, setReglaPermanenciaMaxDias] = useState(
    config?.reglaPermanenciaMaxDias ?? 30,
  )

  useEffect(() => {
    if (config) {
      setReglaIngresoEnMora(config.reglaIngresoEnMora)
      setReglaVehiculoDuplicado(config.reglaVehiculoDuplicado)
      setReglaPermanenciaMaxDias(config.reglaPermanenciaMaxDias)
    }
  }, [config])

  const upsertFn = useConvexMutation(api.conjuntoConfig.mutations.upsert)
  const upsertMut = useMutation({ mutationFn: upsertFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertMut.mutateAsync({
        conjuntoId,
        reglaIngresoEnMora,
        reglaVehiculoDuplicado,
        reglaPermanenciaMaxDias,
      })
      toast.success('Configuración actualizada')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  if (!isAdmin) return null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuración del conjunto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reglas de acceso vehicular. Cada regla puede activarse o desactivarse
          independientemente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reglas de acceso vehicular</CardTitle>
            <CardDescription>
              Controlan qué validaciones aplica el sistema cuando un vehículo
              residente intenta ingresar al conjunto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Ingreso en mora genera novedad</FieldLabel>
                  <FieldDescription>
                    Si la unidad del vehículo está en mora, el vigilante debe
                    justificar el ingreso y se genera una novedad de auditoría.
                  </FieldDescription>
                </div>
                <Switch
                  checked={reglaIngresoEnMora}
                  onCheckedChange={setReglaIngresoEnMora}
                />
              </Field>
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Un vehículo por unidad dentro</FieldLabel>
                  <FieldDescription>
                    Solo un vehículo por unidad puede estar dentro del conjunto
                    a la vez. Se permite una moto adicional con confirmación del
                    vigilante.
                  </FieldDescription>
                </div>
                <Switch
                  checked={reglaVehiculoDuplicado}
                  onCheckedChange={setReglaVehiculoDuplicado}
                />
              </Field>
              <Field>
                <FieldLabel>Permanencia máxima (días)</FieldLabel>
                <NumberInput
                  min={0}
                  max={365}
                  value={reglaPermanenciaMaxDias}
                  onChange={(v) => setReglaPermanenciaMaxDias(v ?? 0)}
                />
                <FieldDescription>
                  Máximo de días que un vehículo puede permanecer dentro. Si un
                  vehículo de la unidad excede este límite, se genera novedad al
                  próximo ingreso. Valor 0 desactiva esta regla.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={upsertMut.isPending}>
            {upsertMut.isPending ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </form>
    </div>
  )
}
