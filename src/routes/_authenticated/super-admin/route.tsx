import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SuperAdminLayout } from '#/components/super-admin/layout'

// Role guard is enforced in the parent `_authenticated` loader based on
// pathname. See src/routes/_authenticated.tsx.
export const Route = createFileRoute('/_authenticated/super-admin')({
  component: SuperAdminRoute,
})

function SuperAdminRoute() {
  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  )
}
