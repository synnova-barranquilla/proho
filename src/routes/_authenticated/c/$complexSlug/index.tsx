import { Suspense, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import {
  AlertTriangle,
  ArrowRight,
  Car,
  LogIn,
  ParkingSquare,
  Settings,
  ShieldCheck,
  SquareStack,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
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
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { NumberInput } from '#/components/ui/number-input'
import { Skeleton } from '#/components/ui/skeleton'
import { useIsComplexAdmin } from '#/lib/complex-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { complexConfigDefaults } from '../../../../../convex/complexConfig/validators'

export const Route = createFileRoute('/_authenticated/c/$complexSlug/')({
  loader: async ({ context: { queryClient, complexId } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.complexes.queries.getWithStats,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.accessRecords.queries.getDashboardStats,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.complexConfig.queries.getByComplex,
        { complexId },
      ),
    ])
    return null
  },
  component: ComplexDashboardPage,
})

function ComplexDashboardPage() {
  const ctx = Route.useRouteContext()
  const complexId = ctx.complexId
  const hasControlAcceso = ctx.activeModules.includes('access_control')

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard complexId={complexId} hasControlAcceso={hasControlAcceso} />
      </Suspense>
    </div>
  )
}

function Dashboard({
  complexId,
  hasControlAcceso,
}: {
  complexId: Id<'complexes'>
  hasControlAcceso: boolean
}) {
  const { data } = useSuspenseQuery(
    convexQuery(api.complexes.queries.getWithStats, { complexId }),
  )
  const { complex, stats } = data

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {complex.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {complex.address}, {complex.city}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<SquareStack className="h-4 w-4" />}
          label="Unidades"
          value={stats.units}
          sub={
            stats.unitsInArrears > 0
              ? `${stats.unitsInArrears} en mora`
              : 'Ninguna en mora'
          }
          highlight={stats.unitsInArrears > 0}
        />
        <StatCard
          icon={<UsersRound className="h-4 w-4" />}
          label="Residentes"
          value={stats.activeResidents}
          sub="activos"
        />
        <StatCard
          icon={<Car className="h-4 w-4" />}
          label="Vehículos"
          value={stats.activeVehicles}
          sub="activos"
        />
        {hasControlAcceso && (
          <ParkingCard
            complexId={complexId}
            carros={stats.carParkingSlots}
            motos={stats.motoParkingSlots}
          />
        )}
      </div>

      {hasControlAcceso && (
        <ParkingResumen complexId={complexId} complexSlug={complex.slug} />
      )}
    </>
  )
}

function ParkingCard({
  complexId,
  carros,
  motos,
}: {
  complexId: Id<'complexes'>
  carros: number
  motos: number
}) {
  const isAdmin = useIsComplexAdmin()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Parqueaderos
          </CardTitle>
          <div className="flex items-center gap-1">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
            ) : (
              <ParkingSquare className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold">{carros}</span>
            <span className="text-sm text-muted-foreground">carros</span>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="text-2xl font-semibold">{motos}</span>
            <span className="text-sm text-muted-foreground">motos</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">capacidad total</p>
        </CardContent>
      </Card>

      {isAdmin ? (
        <ParkingSettingsDialog
          open={open}
          onOpenChange={setOpen}
          complexId={complexId}
          initialCarros={carros}
          initialMotos={motos}
        />
      ) : null}
    </>
  )
}

function ParkingSettingsDialog({
  open,
  onOpenChange,
  complexId,
  initialCarros,
  initialMotos,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  complexId: Id<'complexes'>
  initialCarros: number
  initialMotos: number
}) {
  const [carros, setCarros] = useState(initialCarros)
  const [motos, setMotos] = useState(initialMotos)

  const { data: config } = useSuspenseQuery(
    convexQuery(api.complexConfig.queries.getByComplex, { complexId }),
  )

  const mutationFn = useConvexMutation(api.complexConfig.mutations.upsert)
  const mutation = useMutation({ mutationFn })

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({
        complexId,
        ruleEntryInArrears:
          config?.ruleEntryInArrears ??
          complexConfigDefaults.ruleEntryInArrears,
        ruleDuplicateVehicle:
          config?.ruleDuplicateVehicle ??
          complexConfigDefaults.ruleDuplicateVehicle,
        ruleMaxStayDays:
          config?.ruleMaxStayDays ?? complexConfigDefaults.ruleMaxStayDays,
        ruleEntryOverCapacity:
          config?.ruleEntryOverCapacity ??
          complexConfigDefaults.ruleEntryOverCapacity,
        carParkingSlots: carros,
        motoParkingSlots: motos,
      })
      toast.success('Capacidad de parqueaderos actualizada')
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error al actualizar')
      } else {
        toast.error('Error al actualizar')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Capacidad de parqueaderos</DialogTitle>
          <DialogDescription>
            Define el total de espacios disponibles.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <FieldGroup>
            <Field>
              <FieldLabel>Parqueaderos de carros</FieldLabel>
              <NumberInput
                value={carros}
                onChange={(v) => setCarros(v ?? 0)}
                min={0}
              />
            </Field>
            <Field>
              <FieldLabel>Parqueaderos de motos</FieldLabel>
              <NumberInput
                value={motos}
                onChange={(v) => setMotos(v ?? 0)}
                min={0}
              />
            </Field>
          </FieldGroup>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ParkingResumen({
  complexId,
  complexSlug,
}: {
  complexId: Id<'complexes'>
  complexSlug: string
}) {
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.accessRecords.queries.getDashboardStats, {
      complexId,
    }),
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Control de acceso</CardTitle>
        </div>
        <Link
          to="/c/$complexSlug/parqueadero/control-de-acceso"
          params={{ complexSlug }}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          Ver todo
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-semibold">{stats.vehiclesInside}</p>
              <p className="text-xs text-muted-foreground">dentro ahora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-semibold">{stats.entriesToday}</p>
              <p className="text-xs text-muted-foreground">ingresos hoy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-2xl font-semibold">{stats.rejectsToday}</p>
              <p className="text-xs text-muted-foreground">rechazos hoy</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  highlight?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <div
          className={`mt-1 flex items-center gap-1 text-xs ${
            highlight ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {highlight ? <AlertTriangle className="h-3 w-3" /> : null}
          {sub}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </>
  )
}
