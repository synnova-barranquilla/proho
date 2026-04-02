import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin')({
  // TODO: Add role check in beforeLoad when roles are implemented (Phase 2)
  // beforeLoad: ({ context }) => {
  //   if (context.auth?.role !== 'ADMIN') throw redirect({ to: '/' })
  // },
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
