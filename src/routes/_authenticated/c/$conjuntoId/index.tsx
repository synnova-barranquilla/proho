import { Suspense } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Car,
  LogIn,
  ParkingSquare,
  ShieldCheck,
  SquareStack,
  UsersRound,
} from 'lucide-react'

import { buttonVariants } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/c/$conjuntoId/')({
  loader: async ({ context: { queryClient, conjuntoId, conjuntoSlug } }) => {
    // Vigilantes skip the dashboard and go directly to control-acceso.
    // Check membership role (not just orgRole) to handle both MEMBER users
    // and existing users not yet migrated from orgRole='ADMIN'.
    const slugData = await prefetchAuthenticatedQuery(
      queryClient,
      api.conjuntos.queries.getBySlug,
      { slug: conjuntoSlug },
    )
    if (slugData?.membership?.role === 'VIGILANTE') {
      throw redirect({
        to: '/c/$conjuntoId/control-acceso',
        params: { conjuntoId: conjuntoSlug },
      })
    }

    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.conjuntos.queries.getWithStats,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.registrosAcceso.queries.getDashboardStats,
        { conjuntoId },
      ),
    ])
    return null
  },
  component: ConjuntoDashboardPage,
})

function ConjuntoDashboardPage() {
  const { conjuntoId } = Route.useRouteContext()

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard conjuntoId={conjuntoId} />
      </Suspense>
    </div>
  )
}

function Dashboard({ conjuntoId }: { conjuntoId: Id<'conjuntos'> }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.getWithStats, { conjuntoId }),
  )
  const { conjunto, stats } = data

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {conjunto.nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {conjunto.direccion}, {conjunto.ciudad}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<SquareStack className="h-4 w-4" />}
          label="Unidades"
          value={stats.unidades}
          sub={
            stats.unidadesEnMora > 0
              ? `${stats.unidadesEnMora} en mora`
              : 'Ninguna en mora'
          }
          highlight={stats.unidadesEnMora > 0}
        />
        <StatCard
          icon={<UsersRound className="h-4 w-4" />}
          label="Residentes"
          value={stats.residentesActivos}
          sub="activos"
        />
        <StatCard
          icon={<Car className="h-4 w-4" />}
          label="Vehículos"
          value={stats.vehiculosActivos}
          sub="activos"
        />
        <StatCard
          icon={<ParkingSquare className="h-4 w-4" />}
          label="Parqueaderos"
          value={stats.parqueaderosTotales}
          sub={
            stats.parqueaderosInhabilitados > 0
              ? `${stats.parqueaderosInhabilitados} inhabilitados`
              : 'Todos habilitados'
          }
        />
      </div>

      <ParkingResumen conjuntoId={conjuntoId} conjuntoSlug={conjunto.slug} />
    </>
  )
}

function ParkingResumen({
  conjuntoId,
  conjuntoSlug,
}: {
  conjuntoId: Id<'conjuntos'>
  conjuntoSlug: string
}) {
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.getDashboardStats, {
      conjuntoId,
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
          to="/c/$conjuntoId/control-acceso"
          params={{ conjuntoId: conjuntoSlug }}
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
              <p className="text-2xl font-semibold">{stats.vehiculosDentro}</p>
              <p className="text-xs text-muted-foreground">dentro ahora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-semibold">{stats.ingresosHoy}</p>
              <p className="text-xs text-muted-foreground">ingresos hoy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-2xl font-semibold">{stats.novedadesHoy}</p>
              <p className="text-xs text-muted-foreground">novedades hoy</p>
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
