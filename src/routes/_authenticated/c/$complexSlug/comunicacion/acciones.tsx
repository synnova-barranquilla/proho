import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { QuickActionsManager } from '#/components/communications/quick-actions-manager'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/acciones',
)({
  component: AccionesPage,
})

function AccionesPage() {
  const { complexId, complexSlug } = Route.useRouteContext()
  const role = useEffectiveComplexRole()
  const isStaff = role === 'ADMIN' || role === 'AUXILIAR'

  if (!isStaff) {
    return (
      <Navigate
        to="/c/$complexSlug/comunicacion/soporte"
        params={{ complexSlug }}
      />
    )
  }

  return (
    <Suspense fallback={<TabSkeleton />}>
      <QuickActionsManager complexId={complexId} />
    </Suspense>
  )
}
