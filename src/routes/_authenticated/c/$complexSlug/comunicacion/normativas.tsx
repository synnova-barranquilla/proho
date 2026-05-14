import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { NormativasManager } from '#/components/communications/normativas-manager'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/normativas',
)({
  component: NormativasPage,
})

function NormativasPage() {
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
      <NormativasManager complexId={complexId} />
    </Suspense>
  )
}
