import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion',
)({
  ssr: false,
  beforeLoad: ({ context: { complexSlug, activeModules, convexUser } }) => {
    const isSuperAdmin = convexUser.orgRole === 'SUPER_ADMIN'
    if (!activeModules.includes('communications') && !isSuperAdmin) {
      throw redirect({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
  },
  component: () => <Outlet />,
})
