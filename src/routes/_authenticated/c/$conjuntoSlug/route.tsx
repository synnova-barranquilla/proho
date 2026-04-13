import { useEffect, useRef } from 'react'

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

import { ConjuntoLayout } from '#/components/admin/layout'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../convex/_generated/api'

/**
 * Layout base del segmento `/c/$conjuntoSlug/*`.
 *
 * **Importante:** pese al nombre del parámetro (`conjuntoId`) el valor
 * contenido en la URL es el **slug** human-readable del conjunto
 * (`torres-de-la-alhambra`), NO el Convex id. El parámetro conserva el
 * nombre `conjuntoId` por compatibilidad con el árbol de rutas existente.
 *
 * `beforeLoad` resuelve slug → conjunto real vía `conjuntos.queries.getBySlug`,
 * y hace disponible el Convex id real a las rutas hijas a través del
 * contexto de router (`context.conjuntoId`). Las hijas leen ese id real
 * para todas sus queries de Convex (`getRouteApi(...).useRouteContext()`).
 */
export const Route = createFileRoute('/_authenticated/c/$conjuntoSlug')({
  beforeLoad: async ({ context: { queryClient }, params }) => {
    const slug = params.conjuntoSlug

    let data
    try {
      data = await prefetchAuthenticatedQuery(
        queryClient,
        api.conjuntos.queries.getBySlug,
        { slug },
      )
    } catch (err) {
      if (err instanceof ConvexError) {
        throw redirect({ to: '/seleccionar-conjunto' })
      }
      throw err
    }

    if (!data) {
      throw redirect({ to: '/seleccionar-conjunto' })
    }

    return { conjuntoId: data.conjunto._id, conjuntoSlug: slug }
  },
  component: ConjuntoAdminRoute,
})

/** Grace period (ms) antes de declarar un revoke como definitivo. */
const REVOKE_GRACE_MS = 1500

/**
 * Returns true when the error represents a real access revocation
 * (FORBIDDEN, CONJUNTO_NOT_FOUND, etc.), as opposed to a transient
 * auth hiccup (UNAUTHENTICATED during WorkOS token refresh).
 */
function isRevokeError(error: unknown): boolean {
  if (!(error instanceof ConvexError)) return false
  const code = (error.data as { code?: string }).code
  return code !== 'UNAUTHENTICATED'
}

function ConjuntoAdminRoute() {
  const { conjuntoSlug: slug } = Route.useParams()
  const navigate = useNavigate()

  // Reactive subscription — same query key as the prefetch in beforeLoad,
  // so initial render uses the cached data (no loading state). Subsequent
  // re-executions by Convex (e.g. membership revoked in another tab) flow
  // through here.
  const query = useQuery(convexQuery(api.conjuntos.queries.getBySlug, { slug }))

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // While the query is still fetching (initial load, refetch after a
    // Convex reactive re-execution, or WebSocket reconnect), we don't act
    // on intermediate error/null states — they may resolve on their own.
    const isSettled =
      query.fetchStatus === 'idle' &&
      (query.status === 'error' || query.status === 'success')

    if (!isSettled) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const hasRealRevoke =
      (query.status === 'error' && isRevokeError(query.error)) ||
      (query.status === 'success' && query.data === null)

    if (!hasRealRevoke) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Grace period: wait before declaring a definitive revoke. Convex may
    // re-run subscriptions during transient consistency windows (e.g. right
    // after a write to the conjuntos/memberships table) and recover the
    // correct state quickly. If the query settles back to valid data within
    // the window, the cleanup cancels the timer.
    if (timerRef.current === null) {
      timerRef.current = window.setTimeout(() => {
        toast.error('Tu acceso a este conjunto fue revocado', {
          description:
            'Vuelve al selector para elegir otro conjunto al que tengas acceso.',
        })
        void navigate({ to: '/seleccionar-conjunto' })
        timerRef.current = null
      }, REVOKE_GRACE_MS)
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [query.status, query.fetchStatus, query.error, query.data, navigate])

  if (!query.data) return null

  return (
    <ConjuntoLayout
      conjunto={query.data.conjunto}
      membership={query.data.membership}
    >
      <Outlet />
    </ConjuntoLayout>
  )
}
