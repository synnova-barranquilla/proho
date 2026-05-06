import { Suspense } from 'react'

import { createFileRoute, Navigate } from '@tanstack/react-router'

import { InventarioPage } from '#/components/reservas/inventario-page'
import { TabSkeleton } from '#/components/ui/skeleton'
import { useIsComplexAdmin } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/zonas-sociales/configuracion',
)({
  component: ConfiguracionPage,
})

function ConfiguracionPage() {
  const { complexId, complexSlug } = Route.useRouteContext()
  const isAdmin = useIsComplexAdmin()

  if (!isAdmin) {
    return (
      <Navigate
        to="/c/$complexSlug/zonas-sociales/reservas"
        params={{ complexSlug }}
      />
    )
  }

  return (
    <Suspense fallback={<TabSkeleton />}>
      <InventarioPage complexId={complexId} />
    </Suspense>
  )
}
