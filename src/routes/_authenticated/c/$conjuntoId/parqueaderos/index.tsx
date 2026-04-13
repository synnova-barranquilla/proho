import { Suspense } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
import { DataTable } from '#/components/ui/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/c/$conjuntoId/parqueaderos/',
)({
  loader: async ({ context: { queryClient, conjuntoId } }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.parqueaderos.queries.listByConjunto,
      { conjuntoId },
    )
    return null
  },
  component: ParqueaderosPage,
})

function ParqueaderosPage() {
  const { conjuntoId, conjuntoSlug } = Route.useRouteContext()
  const isAdmin = useIsConjuntoAdmin()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Parqueaderos
          </h1>
          <p className="text-sm text-muted-foreground">
            Espacios físicos del conjunto. El estado "ocupado" se deriva del
            módulo de parking en F5.
          </p>
        </div>
        {isAdmin ? (
          <Link
            to="/c/$conjuntoId/parqueaderos/configurar"
            params={{ conjuntoId: conjuntoSlug }}
            className={buttonVariants()}
          >
            <Settings />
            Configurar en bulk
          </Link>
        ) : null}
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ParqueaderosTable conjuntoId={conjuntoId} isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}

function ParqueaderosTable({
  conjuntoId,
  isAdmin,
}: {
  conjuntoId: Id<'conjuntos'>
  isAdmin: boolean
}) {
  const { data: parqs } = useSuspenseQuery(
    convexQuery(api.parqueaderos.queries.listByConjunto, { conjuntoId }),
  )

  const setInhabFn = useConvexMutation(
    api.parqueaderos.mutations.setInhabilitado,
  )
  const setInhab = useMutation({ mutationFn: setInhabFn })

  const handleToggle = async (p: Doc<'parqueaderos'>) => {
    try {
      await setInhab.mutateAsync({
        parqueaderoId: p._id,
        inhabilitado: !p.inhabilitado,
      })
      toast.success(
        p.inhabilitado ? 'Parqueadero habilitado' : 'Parqueadero inhabilitado',
      )
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  const columns: ColumnDef<Doc<'parqueaderos'>>[] = [
    {
      id: 'numero',
      header: 'Número',
      accessorKey: 'numero',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.numero}</span>
      ),
    },
    {
      id: 'tipo',
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ row }) => <Badge variant="outline">{row.original.tipo}</Badge>,
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (p) => (p.inhabilitado ? 'Inhabilitado' : 'Habilitado'),
      cell: ({ row }) =>
        row.original.inhabilitado ? (
          <Badge variant="destructive">Inhabilitado</Badge>
        ) : (
          <Badge variant="outline">Habilitado</Badge>
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
            cell: ({ row }: { row: { original: Doc<'parqueaderos'> } }) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(row.original)}
              >
                {row.original.inhabilitado ? 'Habilitar' : 'Inhabilitar'}
              </Button>
            ),
          } satisfies ColumnDef<Doc<'parqueaderos'>>,
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      data={parqs}
      emptyMessage={
        isAdmin
          ? 'No hay parqueaderos creados. Usa "Configurar en bulk" para generarlos.'
          : 'No hay parqueaderos configurados en este conjunto.'
      }
    />
  )
}
