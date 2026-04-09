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

/**
 * Layout base del segmento `/admin/c/$conjuntoId/*`.
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
export const Route = createFileRoute('/_authenticated/admin/c/$conjuntoId')({
  beforeLoad: async ({ context: { queryClient }, params }) => {
    const slug = params.conjuntoId

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

function ConjuntoAdminRoute() {
  const { conjuntoId: slug } = Route.useParams()
  const navigate = useNavigate()

  // Reactive subscription using the slug-based query, so the parent
  // re-renders when the user's access is revoked in another tab.
  const query = useQuery(convexQuery(api.conjuntos.queries.getBySlug, { slug }))

  useEffect(() => {
    if (query.error || query.data === null) {
      toast.error('Tu acceso a este conjunto fue revocado', {
        description:
          'Vuelve al selector para elegir otro conjunto al que tengas acceso.',
      })
      void navigate({ to: '/seleccionar-conjunto' })
    }
  }, [query.error, query.data, navigate])

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
