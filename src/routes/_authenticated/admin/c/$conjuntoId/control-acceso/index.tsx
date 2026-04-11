import { createFileRoute } from '@tanstack/react-router'

import { ControlAccesoPage } from '#/components/control-acceso/control-acceso-page'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../../convex/_generated/api'

export const Route = createFileRoute(
  '/_authenticated/admin/c/$conjuntoId/control-acceso/',
)({
  loader: async ({ context: { queryClient, conjuntoId } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.registrosAcceso.queries.listActivos,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.vehiculos.queries.listByConjunto,
        { conjuntoId },
      ),
    ])
    return null
  },
  component: ControlAccesoRoute,
})

function ControlAccesoRoute() {
  const { conjuntoId } = Route.useRouteContext()
  return <ControlAccesoPage conjuntoId={conjuntoId} />
}
