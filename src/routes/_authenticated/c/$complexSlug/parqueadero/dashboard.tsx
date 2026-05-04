import { Suspense } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { DashboardTab } from '#/components/control-acceso/dashboard-tab'
import { TabSkeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/parqueadero/dashboard',
)({
  component: DashboardPage,
})

function DashboardPage() {
  const { complexId } = Route.useRouteContext()
  return (
    <Suspense fallback={<TabSkeleton />}>
      <DashboardTab complexId={complexId} />
    </Suspense>
  )
}
