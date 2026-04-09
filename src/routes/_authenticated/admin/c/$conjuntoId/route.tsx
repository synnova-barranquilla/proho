import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

import { AdminLayout } from '#/components/admin/layout'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'

/**
 * Layout base del segmento `/admin/c/$conjuntoId/*`.
 *
 * - `beforeLoad` (runs sequentially, blocks children until resolved):
 *   validates access to the conjunto via `conjuntos.queries.getById`
 *   (which internally applies `requireConjuntoAccess`). If the fetch
 *   throws any ConvexError (FORBIDDEN / CONJUNTO_NOT_FOUND /
 *   CONJUNTO_INACTIVE) we redirect to the selector and child routes
 *   never run their loaders — this prevents a revoked user from
 *   seeing "error" pages when they navigate to a nested URL they no
 *   longer have access to.
 * - The component additionally subscribes reactively to the same
 *   query via `useQuery`. When a running session loses access (owner
 *   revokes the membership in another tab, for example), Convex pushes
 *   an error via the subscription, we surface a toast and navigate
 *   gracefully to the selector.
 */
export const Route = createFileRoute('/_authenticated/admin/c/$conjuntoId')({
  beforeLoad: async ({ context: { queryClient }, params }) => {
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
  const navigate = useNavigate()

  // Reactive subscription — same query key as the prefetch in beforeLoad,
  // so initial render uses the cached data (no loading state), and any
  // subsequent re-execution of the query by Convex (e.g. when the user's
  // membership is revoked in another tab) will flow through here.
  const query = useQuery(
    convexQuery(api.conjuntos.queries.getById, {
      conjuntoId: conjuntoId as Id<'conjuntos'>,
    }),
  )

  useEffect(() => {
    if (query.error) {
      toast.error('Tu acceso a este conjunto fue revocado', {
        description:
          'Vuelve al selector para elegir otro conjunto al que tengas acceso.',
      })
      void navigate({ to: '/seleccionar-conjunto' })
    }
  }, [query.error, navigate])

  // The data exists because beforeLoad prefetched it successfully. If it
  // is momentarily null (query error transition on reactive revoke) we
  // render nothing — the effect above will redirect.
  if (!query.data) return null

  return (
    <AdminLayout
      conjunto={query.data.conjunto}
      membership={query.data.membership}
    >
      <Outlet />
    </AdminLayout>
  )
}
