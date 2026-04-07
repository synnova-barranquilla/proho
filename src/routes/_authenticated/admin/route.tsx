import { createFileRoute, Outlet } from '@tanstack/react-router'

// Role guard is enforced in the parent `_authenticated` loader based on
// pathname. See src/routes/_authenticated.tsx.
export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  // TODO: Replace with real layout (sidebar, header, conjunto selector) in Phase 4
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
