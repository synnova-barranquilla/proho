import { Suspense } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { ResidentChat } from '#/components/communications/resident-chat'
import { StaffTicketsTab } from '#/components/communications/staff-tickets-tab'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/soporte',
)({
  component: SoportePage,
})

function SoportePage() {
  const { complexId } = Route.useRouteContext()
  const role = useEffectiveComplexRole()
  const isStaff = role === 'ADMIN' || role === 'AUXILIAR'

  return (
    <Suspense fallback={<TabSkeleton />}>
      {isStaff ? (
        <StaffTicketsTab complexId={complexId} />
      ) : (
        <ResidentChat complexId={complexId} />
      )}
    </Suspense>
  )
}
