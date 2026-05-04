import { Suspense } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { OperacionTab } from '#/components/control-acceso/operacion-tab'
import { TabSkeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/parqueadero/control-de-acceso',
)({
  component: ControlDeAccesoPage,
})

function ControlDeAccesoPage() {
  const { complexId } = Route.useRouteContext()
  return (
    <Suspense fallback={<TabSkeleton />}>
      <OperacionTab complexId={complexId} />
    </Suspense>
  )
}
