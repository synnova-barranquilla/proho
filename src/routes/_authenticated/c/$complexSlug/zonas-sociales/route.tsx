import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/zonas-sociales',
)({
  ssr: false,
  beforeLoad: ({ context: { complexSlug, activeModules } }) => {
    if (!activeModules.includes('reservas')) {
      throw redirect({
        to: '/c/$complexSlug',
        params: { complexSlug },
      })
    }
  },
  component: () => <Outlet />,
})
