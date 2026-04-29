import { Suspense, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { Plus } from 'lucide-react'

import { ResidenteDialog } from '#/components/admin/residentes/residente-dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { useIsComplexAdmin } from '#/lib/complex-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { formatDocument, formatPhone } from '#/lib/formatters'
import { api } from '../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/residentes/',
)({
  loader: async ({ context: { queryClient, complexId } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.residents.queries.listByComplex,
        { complexId },
      ),
      prefetchAuthenticatedQuery(queryClient, api.units.queries.listByComplex, {
        complexId,
      }),
    ])
    return null
  },
  component: ResidentesPage,
})

type ResidenteRow = Doc<'residents'> & { unit: Doc<'units'> | null }

function ResidentesPage() {
  const { complexId, complexSlug } = Route.useRouteContext()
  const isAdmin = useIsComplexAdmin()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ResidenteRow | null>(null)

  if (!isAdmin) {
    return <Navigate to="/c/$complexSlug" params={{ complexSlug }} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Residentes</h1>
          <p className="text-sm text-muted-foreground">
            Personas vinculadas a las unidades del conjunto.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus />
          Nuevo residente
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ResidentesTable
          complexId={complexId}
          isAdmin={isAdmin}
          onEdit={(r) => {
            setEditing(r)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      <ResidenteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        complexId={complexId}
        residente={editing}
      />
    </div>
  )
}

function ResidentesTable({
  complexId,
  isAdmin,
  onEdit,
}: {
  complexId: Id<'complexes'>
  isAdmin: boolean
  onEdit: (r: ResidenteRow) => void
}) {
  const { data: residentes } = useSuspenseQuery(
    convexQuery(api.residents.queries.listByComplex, { complexId }),
  )

  const columns: ColumnDef<ResidenteRow>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      accessorFn: (r) => `${r.firstName} ${r.lastName}`,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </span>
      ),
    },
    {
      id: 'documento',
      header: 'Documento',
      accessorFn: (r) => r.documentNumber,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.documentType}{' '}
          {formatDocument(row.original.documentNumber)}
        </span>
      ),
    },
    {
      id: 'unidad',
      header: 'Unidad',
      accessorFn: (r) => (r.unit ? `${r.unit.tower}-${r.unit.number}` : ''),
      cell: ({ row }) =>
        row.original.unit
          ? `${row.original.unit.tower}-${row.original.unit.number}`
          : '—',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      accessorKey: 'type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {
            {
              OWNER: 'Propietario',
              LESSEE: 'Arrendatario',
              TENANT: 'Inquilino',
            }[row.original.type]
          }
        </Badge>
      ),
    },
    {
      id: 'contacto',
      header: 'Contacto',
      accessorFn: (r) => r.phone ?? r.email ?? '',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.phone
            ? formatPhone(row.original.phone)
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
