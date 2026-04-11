import { useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { AlertTriangle, Car, DoorOpen, LogIn, LogOut } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface DashboardTabProps {
  conjuntoId: Id<'conjuntos'>
}

interface KpiCardProps {
  title: string
  value: number
  icon: React.ReactNode
  className?: string
}

function KpiCard({ title, value, icon, className }: KpiCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function DashboardTab({ conjuntoId }: DashboardTabProps) {
  const { data: stats } = useSuspenseQuery(
    convexQuery(api.registrosAcceso.queries.getDashboardStats, {
      conjuntoId,
    }),
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Vehículos dentro"
        value={stats.vehiculosDentro}
        icon={<Car className="h-5 w-5 text-muted-foreground" />}
      />
      <KpiCard
        title="Ingresos hoy"
        value={stats.ingresosHoy}
        icon={<LogIn className="h-5 w-5 text-green-600" />}
      />
      <KpiCard
        title="Salidas hoy"
        value={stats.salidasHoy}
        icon={<LogOut className="h-5 w-5 text-blue-600" />}
      />
      <KpiCard
        title="Novedades hoy"
        value={stats.novedadesHoy}
        icon={<DoorOpen className="h-5 w-5 text-amber-600" />}
      />
      <KpiCard
        title="Rechazos hoy"
        value={stats.rechazosHoy}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
      />
    </div>
  )
}
