import { createFileRoute, redirect } from '@tanstack/react-router'

import { ControlAccesoPage } from '#/components/control-acceso/control-acceso-page'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/control-acceso/',
)({
  loader: async ({
    context: { queryClient, complexId, complexSlug, activeModules },
  }) => {
    if (!activeModules.includes('control_acceso')) {
      throw redirect({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.accessRecords.queries.listActive,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.accessRecords.queries.listRecent,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.vehicles.queries.listByComplex,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.complexConfig.queries.getByComplex,
        { complexId },
      ),
    ])
    return null
  },
  component: ControlAccesoRoute,
})

function ControlAccesoRoute() {
  const { complexId } = Route.useRouteContext()
  return <ControlAccesoPage complexId={complexId} />
}
