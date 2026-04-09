import { Suspense } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery } from '@convex-dev/react-query'
import { ExternalLink } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { buttonVariants } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../convex/_generated/api'
import type { Doc } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/super-admin/conjuntos')({
  loader: async ({ context: { queryClient } }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.conjuntos.queries.listAllForSuperAdmin,
      {},
    )
    return null
  },
  component: SuperAdminConjuntosPage,
})

type ConjuntoRow = Doc<'conjuntos'> & {
  organization: Doc<'organizations'> | null
}

function SuperAdminConjuntosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conjuntos</h1>
        <p className="text-sm text-muted-foreground">
          Lista global de conjuntos en todas las organizaciones. Haz click en
          "Abrir" para entrar como super admin.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ConjuntosTable />
      </Suspense>
    </div>
  )
}

function ConjuntosTable() {
  const { data } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.listAllForSuperAdmin, {}),
  )

  const columns: ColumnDef<ConjuntoRow>[] = [
    {
      id: 'organizacion',
      header: 'Organización',
      accessorFn: (c) => c.organization?.name ?? '',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.organization?.name ?? '—'}
        </span>
      ),
    },
    {
      id: 'nombre',
      header: 'Conjunto',
      accessorKey: 'nombre',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.nombre}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.slug}
          </span>
        </div>
      ),
    },
    {
      id: 'ciudad',
      header: 'Ciudad',
      accessorKey: 'ciudad',
    },
    {
      id: 'direccion',
      header: 'Dirección',
      accessorKey: 'direccion',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.direccion}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (c) => (c.active ? 'Activo' : 'Inactivo'),
      cell: ({ row }) =>
        row.original.active ? (
          <Badge variant="outline">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      meta: {
        headClassName: 'text-right',
        cellClassName: 'text-right',
      },
      cell: ({ row }) => (
        <Link
          to="/admin/c/$conjuntoId"
          params={{ conjuntoId: row.original.slug }}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ExternalLink />
          Abrir
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data as ConjuntoRow[]}
      emptyMessage="No hay conjuntos registrados en ninguna organización."
    />
  )
}
