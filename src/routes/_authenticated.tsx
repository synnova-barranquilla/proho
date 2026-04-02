import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location: _location }) => {
    // TODO (Phase 2): Check auth from context when WorkOS is implemented
    // if (!context.auth?.user) {
    //   throw redirect({ to: '/', search: { redirect: location.href } })
    // }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
