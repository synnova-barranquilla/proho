import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { NovedadesTab } from '#/components/control-acceso/novedades-tab'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useIsComplexAdmin } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/parqueadero/novedades',
)({
  component: NovedadesPage,
})

function NovedadesPage() {
  const { complexId, complexSlug } = Route.useRouteContext()
  const isAdmin = useIsComplexAdmin()

  if (!isAdmin) {
    return (
      <Navigate
        to="/c/$complexSlug/parqueadero/control-de-acceso"
        params={{ complexSlug }}
      />
    )
  }

  return (
    <Suspense fallback={<TabSkeleton />}>
      <NovedadesTab complexId={complexId} />
    </Suspense>
  )
}
