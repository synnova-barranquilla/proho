import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { CommsConfigPage } from '#/components/communications/comms-config-page'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/configuracion',
)({
  component: ConfiguracionPage,
})

function ConfiguracionPage() {
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
      <CommsConfigPage complexId={complexId} />
    </Suspense>
  )
}
