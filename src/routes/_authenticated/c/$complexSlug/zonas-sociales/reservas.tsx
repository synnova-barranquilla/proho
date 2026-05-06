import { Suspense } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { ReservasPage } from '#/components/reservas/reservas-page'
import { TabSkeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/zonas-sociales/reservas',
)({
  component: ReservasRoute,
})

function ReservasRoute() {
  const { complexId } = Route.useRouteContext()
  return (
    <Suspense fallback={<TabSkeleton />}>
      <ReservasPage complexId={complexId} />
    </Suspense>
  )
}
