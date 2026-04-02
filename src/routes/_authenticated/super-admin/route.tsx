import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/super-admin')({
  // TODO: Add role check in beforeLoad when roles are implemented (Phase 2)
  // beforeLoad: ({ context }) => {
  //   if (context.auth?.role !== 'SUPER_ADMIN') throw redirect({ to: '/' })
  // },
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
