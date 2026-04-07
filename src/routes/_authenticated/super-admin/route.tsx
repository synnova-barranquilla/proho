import { createFileRoute, Outlet } from '@tanstack/react-router'

// Role guard is enforced in the parent `_authenticated` loader based on
// pathname. See src/routes/_authenticated.tsx.
export const Route = createFileRoute('/_authenticated/super-admin')({
  component: SuperAdminLayout,
})

function SuperAdminLayout() {
  // TODO: Replace with real layout (sidebar, header) in Phase 3
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
