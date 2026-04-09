import { Suspense } from 'react'

import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
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
  '/_authenticated/admin/c/$conjuntoId/parqueaderos/',
)({
  loader: async ({ context: { queryClient }, params }) => {
    await prefetchAuthenticatedQuery(
      queryClient,
      api.parqueaderos.queries.listByConjunto,
      { conjuntoId: params.conjuntoId as Id<'conjuntos'> },
    )
    return null
  },
  component: ParqueaderosPage,
})

function ParqueaderosPage() {
  const { conjuntoId } = Route.useParams()
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
            to="/admin/c/$conjuntoId/parqueaderos/configurar"
            params={{ conjuntoId }}
            className={buttonVariants()}
          >
            <Settings />
            Configurar en bulk
          </Link>
        ) : null}
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ParqueaderosTable
          conjuntoId={conjuntoId as Id<'conjuntos'>}
          isAdmin={isAdmin}
        />
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

  if (parqs.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        {isAdmin
          ? 'No hay parqueaderos creados. Usa "Configurar en bulk" para generarlos.'
          : 'No hay parqueaderos configurados en este conjunto.'}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          {isAdmin ? (
            <TableHead className="text-right">Acciones</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {parqs.map((p) => (
          <TableRow key={p._id}>
            <TableCell className="font-mono font-medium">{p.numero}</TableCell>
            <TableCell>
              <Badge variant="outline">{p.tipo}</Badge>
            </TableCell>
            <TableCell>
              {p.inhabilitado ? (
                <Badge variant="destructive">Inhabilitado</Badge>
              ) : (
                <Badge variant="outline">Habilitado</Badge>
              )}
            </TableCell>
            {isAdmin ? (
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(p)}
                >
                  {p.inhabilitado ? 'Habilitar' : 'Inhabilitar'}
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
