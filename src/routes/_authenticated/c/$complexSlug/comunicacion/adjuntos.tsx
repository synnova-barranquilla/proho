import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { AttachmentsTab } from '#/components/communications/attachments-tab'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/adjuntos',
)({
  component: AdjuntosPage,
})

function AdjuntosPage() {
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
      <AttachmentsTab complexId={complexId} />
    </Suspense>
  )
}
