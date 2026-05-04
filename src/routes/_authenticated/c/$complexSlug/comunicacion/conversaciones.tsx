import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { StaffConversationsTab } from '#/components/communications/staff-conversations-tab'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/conversaciones',
)({
  component: ConversacionesPage,
})

function ConversacionesPage() {
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
      <StaffConversationsTab complexId={complexId} />
    </Suspense>
  )
}
