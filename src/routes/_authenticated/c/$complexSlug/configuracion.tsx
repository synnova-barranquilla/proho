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
import { useIsComplexAdmin } from '#/lib/complex-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../convex/_generated/api'
import { complexConfigDefaults } from '../../../../../convex/complexConfig/validators'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/configuracion',
)({
  loader: async ({ context: { queryClient, complexId } }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.complexConfig.queries.getByComplex,
      { complexId },
    )
    return null
  },
  component: ConfiguracionPage,
})

function ConfiguracionPage() {
  const ctx = Route.useRouteContext()
  const { complexId, complexSlug } = ctx
  const hasControlAcceso = ctx.activeModules.includes('access_control')
  const navigate = useNavigate()
  const isAdmin = useIsComplexAdmin()

  useEffect(() => {
    if (!isAdmin) {
      void navigate({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
  }, [isAdmin, navigate, complexSlug])

  const { data: config } = useSuspenseQuery(
    convexQuery(api.complexConfig.queries.getByComplex, {
      complexId,
    }),
  )

  const [ruleEntryInArrears, setRuleEntryInArrears] = useState(
    config?.ruleEntryInArrears ?? complexConfigDefaults.ruleEntryInArrears,
  )
  const [ruleDuplicateVehicle, setRuleDuplicateVehicle] = useState(
    config?.ruleDuplicateVehicle ?? complexConfigDefaults.ruleDuplicateVehicle,
  )
  const [ruleMaxStayDays, setRuleMaxStayDays] = useState(
    config?.ruleMaxStayDays ?? complexConfigDefaults.ruleMaxStayDays,
  )
  const [ruleEntryOverCapacity, setRuleEntryOverCapacity] = useState(
    config?.ruleEntryOverCapacity ??
      complexConfigDefaults.ruleEntryOverCapacity,
  )
  const [carParkingSlots, setCarParkingSlots] = useState(
    config?.carParkingSlots ?? complexConfigDefaults.carParkingSlots,
  )
  const [motoParkingSlots, setMotoParkingSlots] = useState(
    config?.motoParkingSlots ?? complexConfigDefaults.motoParkingSlots,
  )

  useEffect(() => {
    if (config) {
      setRuleEntryInArrears(config.ruleEntryInArrears)
      setRuleDuplicateVehicle(config.ruleDuplicateVehicle)
      setRuleMaxStayDays(config.ruleMaxStayDays)
      setRuleEntryOverCapacity(config.ruleEntryOverCapacity)
      setCarParkingSlots(config.carParkingSlots)
      setMotoParkingSlots(config.motoParkingSlots)
    }
  }, [config])

  const upsertFn = useConvexMutation(api.complexConfig.mutations.upsert)
  const upsertMut = useMutation({ mutationFn: upsertFn })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertMut.mutateAsync({
        complexId,
        ruleEntryInArrears,
        ruleDuplicateVehicle,
        ruleMaxStayDays,
        ruleEntryOverCapacity,
        carParkingSlots,
        motoParkingSlots,
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
        {hasControlAcceso && (
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
                      justificar el ingreso y se genera una novedad.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={ruleEntryInArrears}
                    onCheckedChange={setRuleEntryInArrears}
                  />
                </Field>
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel>Un vehículo por unidad dentro</FieldLabel>
                    <FieldDescription>
                      Solo un vehículo por unidad puede estar dentro del
                      conjunto a la vez. Se permite una moto adicional con
                      confirmación del vigilante.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={ruleDuplicateVehicle}
                    onCheckedChange={setRuleDuplicateVehicle}
                  />
                </Field>
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel>Sobrecupo genera novedad</FieldLabel>
                    <FieldDescription>
                      Si los parqueaderos están llenos, el vigilante debe
                      justificar el ingreso y se genera una novedad. Aplica a
                      residentes y visitantes; las visitas administrativas
                      quedan exentas.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={ruleEntryOverCapacity}
                    onCheckedChange={setRuleEntryOverCapacity}
                  />
                </Field>
                <Field>
                  <FieldLabel>Permanencia máxima (días)</FieldLabel>
                  <NumberInput
                    min={0}
                    max={365}
                    value={ruleMaxStayDays}
                    onChange={(v) => setRuleMaxStayDays(v ?? 0)}
                  />
                  <FieldDescription>
                    Máximo de días que un vehículo puede permanecer dentro. Si
                    un vehículo de la unidad excede este límite, se genera
                    novedad al próximo ingreso. Valor 0 desactiva esta regla.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {hasControlAcceso && (
          <Card>
            <CardHeader>
              <CardTitle>Parqueaderos</CardTitle>
              <CardDescription>
                Capacidad total de espacios de parqueadero del conjunto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Parqueaderos de carros</FieldLabel>
                  <NumberInput
                    min={0}
                    value={carParkingSlots}
                    onChange={(v) => setCarParkingSlots(v ?? 0)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Parqueaderos de motos</FieldLabel>
                  <NumberInput
                    min={0}
                    value={motoParkingSlots}
                    onChange={(v) => setMotoParkingSlots(v ?? 0)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={upsertMut.isPending}>
            {upsertMut.isPending ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </form>
    </div>
  )
}
