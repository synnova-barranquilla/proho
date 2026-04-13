import { createFileRoute, redirect } from '@tanstack/react-router'

import { ControlAccesoPage } from '#/components/control-acceso/control-acceso-page'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'

export const Route = createFileRoute(
  '/_authenticated/c/$conjuntoSlug/control-acceso/',
)({
  loader: async ({
    context: { queryClient, conjuntoId, conjuntoSlug, activeModules },
  }) => {
    if (!(activeModules).includes('control_acceso')) {
      throw redirect({
        to: '/c/$conjuntoSlug',
        params: { conjuntoSlug },
      })
    }
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.registrosAcceso.queries.listActivos,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.registrosAcceso.queries.listRecientes,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.vehiculos.queries.listByConjunto,
        { conjuntoId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.conjuntoConfig.queries.getByConjunto,
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
