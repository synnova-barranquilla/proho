import { Suspense, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { Plus } from 'lucide-react'

import { ResidenteDialog } from '#/components/admin/residentes/residente-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { formatDocument, formatPhone } from '#/lib/formatters'
import { api } from '../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/c/$conjuntoSlug/residentes/',
)({
  loader: async ({ context: { queryClient, conjuntoId } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.residentes.queries.listByConjunto,
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
  component: ResidentesPage,
})

type ResidenteRow = Doc<'residentes'> & { unidad: Doc<'unidades'> | null }

function ResidentesPage() {
  const { conjuntoId } = Route.useRouteContext()
  const isAdmin = useIsConjuntoAdmin()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ResidenteRow | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Residentes</h1>
          <p className="text-sm text-muted-foreground">
            Personas vinculadas a las unidades del conjunto.
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
            Nuevo residente
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ResidentesTable
          conjuntoId={conjuntoId}
          isAdmin={isAdmin}
          onEdit={(r) => {
            setEditing(r)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      {isAdmin ? (
        <ResidenteDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditing(null)
          }}
          conjuntoId={conjuntoId}
          residente={editing}
        />
      ) : null}
    </div>
  )
}

function ResidentesTable({
  conjuntoId,
  isAdmin,
  onEdit,
}: {
  conjuntoId: Id<'conjuntos'>
  isAdmin: boolean
  onEdit: (r: ResidenteRow) => void
}) {
  const { data: residentes } = useSuspenseQuery(
    convexQuery(api.residentes.queries.listByConjunto, { conjuntoId }),
  )

  const columns: ColumnDef<ResidenteRow>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      accessorFn: (r) => `${r.nombres} ${r.apellidos}`,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.nombres} {row.original.apellidos}
        </span>
      ),
    },
    {
      id: 'documento',
      header: 'Documento',
      accessorFn: (r) => r.numeroDocumento,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.tipoDocumento}{' '}
          {formatDocument(row.original.numeroDocumento)}
        </span>
      ),
    },
    {
      id: 'unidad',
      header: 'Unidad',
      accessorFn: (r) =>
        r.unidad ? `${r.unidad.torre}-${r.unidad.numero}` : '',
      cell: ({ row }) =>
        row.original.unidad
          ? `${row.original.unidad.torre}-${row.original.unidad.numero}`
          : '—',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.tipo}
        </Badge>
      ),
    },
    {
      id: 'contacto',
      header: 'Contacto',
      accessorFn: (r) => r.telefono ?? r.email ?? '',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.telefono
            ? formatPhone(row.original.telefono)
            : row.original.email || '—'}
        </span>
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
            cell: ({ row }: { row: { original: ResidenteRow } }) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(row.original)}
              >
                Editar
              </Button>
            ),
          } satisfies ColumnDef<ResidenteRow>,
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      data={residentes as ResidenteRow[]}
      emptyMessage={
        isAdmin
          ? 'No hay residentes. Crea el primero con el botón "Nuevo residente".'
          : 'No hay residentes registrados.'
      }
    />
  )
}
