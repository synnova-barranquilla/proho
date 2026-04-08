import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'

import { AdminLayout } from '#/components/admin/layout'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'

/**
 * Layout base del segmento `/admin/c/$conjuntoId/*`.
 *
 * - Valida acceso al conjunto (via `conjuntos.queries.getById` que internamente
 *   aplica `requireConjuntoAccess`).
 * - Si falla (FORBIDDEN, CONJUNTO_NOT_FOUND, CONJUNTO_INACTIVE), redirige al
 *   selector para que el user elija otro conjunto.
 * - Wraps children in AdminLayout (sidebar + header + ConjuntoSwitcher).
 */
export const Route = createFileRoute('/_authenticated/admin/c/$conjuntoId')({
  loader: async ({ context: { queryClient }, params }) => {
    const conjuntoId = params.conjuntoId as Id<'conjuntos'>

    try {
      await prefetchAuthenticatedQuery(
        queryClient,
        api.conjuntos.queries.getById,
        { conjuntoId },
      )
    } catch (err) {
      if (err instanceof ConvexError) {
        throw redirect({ to: '/seleccionar-conjunto' })
      }
      throw err
    }

    return { conjuntoId }
  },
  component: ConjuntoAdminRoute,
})

function ConjuntoAdminRoute() {
  const { conjuntoId } = Route.useParams()
  const { data } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.getById, {
      conjuntoId: conjuntoId as Id<'conjuntos'>,
    }),
  )

  return (
    <AdminLayout conjunto={data.conjunto}>
      <Outlet />
    </AdminLayout>
  )
}
