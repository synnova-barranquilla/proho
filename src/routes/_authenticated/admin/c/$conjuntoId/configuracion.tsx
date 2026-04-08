import { useEffect, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

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
import { Input } from '#/components/ui/input'
import { Switch } from '#/components/ui/switch'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/configuracion',
)({
  loader: async ({ context: { queryClient }, params }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.conjuntoConfig.queries.getByConjunto,
      { conjuntoId: params.conjuntoId as Id<'conjuntos'> },
    )
    return null
  },
  component: ConfiguracionPage,
})

function ConfiguracionPage() {
  const { conjuntoId } = Route.useParams()
  const { data: config } = useSuspenseQuery(
    convexQuery(api.conjuntoConfig.queries.getByConjunto, {
      conjuntoId: conjuntoId as Id<'conjuntos'>,
    }),
  )

  const [maxHorasVisitante, setMaxHorasVisitante] = useState(
    config?.maxHorasVisitante ?? 4,
  )
  const [permitirSalidaMora, setPermitirSalidaMora] = useState(
    config?.permitirSalidaMora ?? false,
  )
  const [requiereFotoPlaca, setRequiereFotoPlaca] = useState(
    config?.requiereFotoPlaca ?? true,
  )
  const [regVehResObligatorio, setRegVehResObligatorio] = useState(
    config?.registroVehiculoResidenteObligatorio ?? true,
  )
  const [toleranciaMin, setToleranciaMin] = useState(
    config?.toleranciaSalidaMinutos ?? 15,
  )

  useEffect(() => {
    if (config) {
      setMaxHorasVisitante(config.maxHorasVisitante)
      setPermitirSalidaMora(config.permitirSalidaMora)
      setRequiereFotoPlaca(config.requiereFotoPlaca)
      setRegVehResObligatorio(config.registroVehiculoResidenteObligatorio)
      setToleranciaMin(config.toleranciaSalidaMinutos)
    }
  }, [config])

  const upsertFn = useConvexMutation(api.conjuntoConfig.mutations.upsert)
  const upsertMut = useMutation({ mutationFn: upsertFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertMut.mutateAsync({
        conjuntoId: conjuntoId as Id<'conjuntos'>,
        maxHorasVisitante,
        permitirSalidaMora,
        requiereFotoPlaca,
        registroVehiculoResidenteObligatorio: regVehResObligatorio,
        toleranciaSalidaMinutos: toleranciaMin,
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuración del conjunto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reglas que el motor de parking leerá cuando esté activo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reglas de visitantes</CardTitle>
            <CardDescription>
              Control de tiempo y comportamiento para vehículos de visitantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Máximo horas por visita</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={168}
                  value={maxHorasVisitante}
                  onChange={(e) =>
                    setMaxHorasVisitante(parseInt(e.target.value, 10) || 0)
                  }
                />
                <FieldDescription>
                  Máximo tiempo que un visitante puede permanecer en el
                  conjunto.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Tolerancia de salida (minutos)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={240}
                  value={toleranciaMin}
                  onChange={(e) =>
                    setToleranciaMin(parseInt(e.target.value, 10) || 0)
                  }
                />
                <FieldDescription>
                  Minutos de gracia antes de aplicar tiempo extra.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reglas de residentes</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Permitir salida de unidades en mora</FieldLabel>
                  <FieldDescription>
                    Si está apagado, el motor bloquea la salida de vehículos de
                    unidades marcadas en mora.
                  </FieldDescription>
                </div>
                <Switch
                  checked={permitirSalidaMora}
                  onCheckedChange={setPermitirSalidaMora}
                />
              </Field>
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Registro obligatorio de vehículos</FieldLabel>
                  <FieldDescription>
                    Si está encendido, los vehículos de residentes deben estar
                    pre-registrados para poder entrar.
                  </FieldDescription>
                </div>
                <Switch
                  checked={regVehResObligatorio}
                  onCheckedChange={setRegVehResObligatorio}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reglas de vigilancia</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Foto de placa obligatoria</FieldLabel>
                  <FieldDescription>
                    El vigilante debe capturar una foto de la placa en cada
                    registro.
                  </FieldDescription>
                </div>
                <Switch
                  checked={requiereFotoPlaca}
                  onCheckedChange={setRequiereFotoPlaca}
                />
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
