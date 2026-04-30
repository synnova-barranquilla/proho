import { createFileRoute, redirect } from '@tanstack/react-router'

import { CommunicationsPage } from '#/components/communications/communications-page'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/communications/',
)({
  ssr: false,
  beforeLoad: async ({
    context: { complexSlug, activeModules, convexUser },
  }) => {
    const isSuperAdmin = convexUser.orgRole === 'SUPER_ADMIN'
    if (!activeModules.includes('communications') && !isSuperAdmin) {
      throw redirect({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
  },
  component: CommunicationsRoute,
})

function CommunicationsRoute() {
  const { complexId } = Route.useRouteContext()
  return <CommunicationsPage complexId={complexId} />
}
