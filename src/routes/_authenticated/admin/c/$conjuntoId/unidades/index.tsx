import { Suspense, useState } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { UnidadDialog } from '#/components/admin/unidades/unidad-dialog'
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
import { useIsConjuntoAdmin } from '#/lib/conjunto-role'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/unidades/',
)({
  loader: async ({ context: { queryClient, conjuntoId } }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.unidades.queries.listByConjunto,
      { conjuntoId },
    )
    return null
  },
  component: UnidadesPage,
})

function UnidadesPage() {
  const { conjuntoId } = Route.useRouteContext()
  const isAdmin = useIsConjuntoAdmin()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Doc<'unidades'> | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            Apartamentos, casas y locales agrupados por torre.
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
            Nueva unidad
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<TorresSkeleton />}>
        <TorresList
          conjuntoId={conjuntoId}
          isAdmin={isAdmin}
          onEdit={(u) => {
            setEditing(u)
            setDialogOpen(true)
          }}
        />
      </Suspense>

      {isAdmin ? (
        <UnidadDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditing(null)
          }}
          conjuntoId={conjuntoId}
          unidad={editing}
        />
      ) : null}
    </div>
  )
}

function TorresList({
  conjuntoId,
  isAdmin,
  onEdit,
}: {
  conjuntoId: Id<'conjuntos'>
  isAdmin: boolean
  onEdit: (u: Doc<'unidades'>) => void
}) {
  const { data } = useSuspenseQuery(
    convexQuery(api.unidades.queries.listByConjunto, { conjuntoId }),
  )

  const setMoraFn = useConvexMutation(api.unidades.mutations.setMora)
  const setMora = useMutation({ mutationFn: setMoraFn })

  const handleToggleMora = async (u: Doc<'unidades'>) => {
    try {
      await setMora.mutateAsync({
        unidadId: u._id,
        enMora: !u.enMora,
      })
      toast.success(u.enMora ? 'Mora removida' : 'Unidad marcada en mora')
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string }
        toast.error(d.message ?? 'Error')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  if (data.total === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        {isAdmin
          ? 'No hay unidades. Crea la primera con el botón "Nueva unidad".'
          : 'No hay unidades en este conjunto.'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {data.torres.map((t) => (
        <div key={t.torre} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Torre {t.torre}{' '}
            <span className="text-xs font-normal">
              ({t.unidades.length} unidades)
            </span>
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-muted-foreground">#</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mora</TableHead>
                {isAdmin ? (
                  <TableHead className="text-right">Acciones</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.unidades.map((u, i) => (
                <TableRow key={u._id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{u.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {u.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.enMora ? (
                      <Badge variant="destructive">En mora</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Al día
                      </span>
                    )}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleMora(u)}
                        >
                          {u.enMora ? 'Quitar mora' : 'Marcar mora'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(u)}
                        >
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  )
}

function TorresSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
