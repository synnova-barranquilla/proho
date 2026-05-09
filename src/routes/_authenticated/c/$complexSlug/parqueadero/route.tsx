import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'
import { MS_PER_DAY } from '../../../../../../convex/lib/constants'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/parqueadero',
)({
  beforeLoad: ({ context: { complexSlug, activeModules } }) => {
    if (!activeModules.includes('access_control')) {
      throw redirect({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
  },
  loader: async ({ context: { queryClient, complexId } }) => {
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.accessRecords.queries.listActive,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.accessRecords.queries.listRecent,
        { complexId, cutoffTimestamp: Date.now() - MS_PER_DAY },
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
      prefetchAuthenticatedQuery(
        queryClient,
        api.accessRecords.queries.getActiveStats,
        { complexId },
      ),
    ])
    return null
  },
  component: () => <Outlet />,
})
