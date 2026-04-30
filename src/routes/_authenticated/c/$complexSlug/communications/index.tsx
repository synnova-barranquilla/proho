import { createFileRoute, redirect } from '@tanstack/react-router'

import { CommunicationsPage } from '#/components/communications/communications-page'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../../../../convex/_generated/api'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/communications/',
)({
  loader: async ({
    context: { queryClient, complexId, complexSlug, activeModules, convexUser },
  }) => {
    const isSuperAdmin = convexUser.orgRole === 'SUPER_ADMIN'
    if (!activeModules.includes('communications') && !isSuperAdmin) {
      throw redirect({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
    await Promise.all([
      prefetchAuthenticatedQuery(
        queryClient,
        api.communications.queries.listCategories,
        { complexId },
      ),
      prefetchAuthenticatedQuery(
        queryClient,
        api.communications.queries.listQuickActions,
        { complexId },
      ),
    ])
    return null
  },
  component: CommunicationsRoute,
})

function CommunicationsRoute() {
  const { complexId } = Route.useRouteContext()
  return <CommunicationsPage complexId={complexId} />
}
