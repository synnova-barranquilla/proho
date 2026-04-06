import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => {
    const convexUser = (context as { convexUser?: { orgRole: string } })
      .convexUser
    if (!convexUser || convexUser.orgRole !== 'ADMIN') {
      throw redirect({ to: '/no-autorizado' })
    }
  },
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
