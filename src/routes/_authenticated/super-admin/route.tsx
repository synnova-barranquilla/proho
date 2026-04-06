import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/super-admin')({
  beforeLoad: ({ context }) => {
    const convexUser = (context as { convexUser?: { orgRole: string } })
      .convexUser
    if (!convexUser || convexUser.orgRole !== 'SUPER_ADMIN') {
      throw redirect({ to: '/no-autorizado' })
    }
  },
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
