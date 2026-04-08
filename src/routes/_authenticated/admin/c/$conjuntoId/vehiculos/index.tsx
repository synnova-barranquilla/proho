import { Suspense, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { Plus } from 'lucide-react'

import { VehiculoDialog } from '#/components/admin/vehiculos/vehiculo-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/vehiculos/',
)({
  loader: async ({ context: { queryClient }, params }) => {
    const conjuntoId = params.conjuntoId as Id<'conjuntos'>
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.vehiculos.queries.listByConjunto,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.unidades.queries.listByConjunto,
        { conjuntoId },
      ),
    ])
    return null
  },
  component: VehiculosPage,
})

type VehiculoRow = Doc<'vehiculos'> & { unidad: Doc<'unidades'> | null }

function VehiculosPage() {
  const { conjuntoId } = Route.useParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VehiculoRow | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted-foreground">
            Vehículos registrados en el conjunto, asociados a una unidad.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus />
          Nuevo vehículo
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <VehiculosTable
          conjuntoId={conjuntoId as Id<'conjuntos'>}
          onEdit={(v) => {
            setEditing(v)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      <VehiculoDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        conjuntoId={conjuntoId as Id<'conjuntos'>}
        vehiculo={editing}
      />
    </div>
  )
}

function VehiculosTable({
  conjuntoId,
  onEdit,
}: {
  conjuntoId: Id<'conjuntos'>
  onEdit: (v: VehiculoRow) => void
}) {
  const { data } = useSuspenseQuery(
    convexQuery(api.vehiculos.queries.listByConjunto, { conjuntoId }),
  )

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        No hay vehículos registrados. Crea el primero con "Nuevo vehículo".
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Placa</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Unidad</TableHead>
          <TableHead>Propietario</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((v) => (
          <TableRow key={v._id}>
            <TableCell className="font-mono font-medium">{v.placa}</TableCell>
            <TableCell>
              <Badge variant="outline">{v.tipo}</Badge>
            </TableCell>
            <TableCell>
              {v.unidad ? `${v.unidad.torre}-${v.unidad.numero}` : '—'}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {v.propietarioNombre ?? '—'}
            </TableCell>
            <TableCell>
              {v.active ? (
                <Badge variant="outline">Activo</Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(v as VehiculoRow)}
              >
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
