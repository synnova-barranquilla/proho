import { Suspense, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { Plus } from 'lucide-react'

import { VehiculoDialog } from '#/components/admin/vehiculos/vehiculo-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { formatPlaca } from '#/lib/formatters'
import { api } from '../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/c/$conjuntoSlug/vehiculos/',
)({
  loader: async ({ context: { queryClient, conjuntoId } }) => {
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
  const { conjuntoId } = Route.useRouteContext()
  const isAdmin = useIsConjuntoAdmin()
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
        {isAdmin ? (
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus />
            Nuevo vehículo
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <VehiculosTable
          conjuntoId={conjuntoId}
          isAdmin={isAdmin}
          onEdit={(v) => {
            setEditing(v)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      {isAdmin ? (
        <VehiculoDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditing(null)
          }}
          conjuntoId={conjuntoId}
          vehiculo={editing}
        />
      ) : null}
    </div>
  )
}

function VehiculosTable({
  conjuntoId,
  isAdmin,
  onEdit,
}: {
  conjuntoId: Id<'conjuntos'>
  isAdmin: boolean
  onEdit: (v: VehiculoRow) => void
}) {
  const { data } = useSuspenseQuery(
    convexQuery(api.vehiculos.queries.listByConjunto, { conjuntoId }),
  )

  const columns: ColumnDef<VehiculoRow>[] = [
    {
      id: 'placa',
      header: 'Placa',
      accessorKey: 'placa',
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {formatPlaca(row.original.placa)}
        </span>
      ),
    },
    {
      id: 'tipo',
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ row }) => <Badge variant="outline">{row.original.tipo}</Badge>,
    },
    {
      id: 'unidad',
      header: 'Unidad',
      accessorFn: (v) =>
        v.unidad ? `${v.unidad.torre}-${v.unidad.numero}` : '',
      cell: ({ row }) =>
        row.original.unidad
          ? `${row.original.unidad.torre}-${row.original.unidad.numero}`
          : '—',
    },
    {
      id: 'propietario',
      header: 'Propietario',
      accessorFn: (v) => v.propietarioNombre ?? '',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.propietarioNombre ?? '—'}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (v) => (v.active ? 'Activo' : 'Inactivo'),
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="outline">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    ...(isAdmin
      ? [
          {
            id: 'acciones',
            header: () => <span className="sr-only">Acciones</span>,
            enableSorting: false,
            meta: {
              headClassName: 'text-right',
              cellClassName: 'text-right',
            },
            cell: ({ row }: { row: { original: VehiculoRow } }) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(row.original)}
              >
                Editar
              </Button>
            ),
          } satisfies ColumnDef<VehiculoRow>,
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      data={data as VehiculoRow[]}
      emptyMessage={
        isAdmin
          ? 'No hay vehículos registrados. Crea el primero con "Nuevo vehículo".'
          : 'No hay vehículos registrados.'
      }
    />
  )
}
