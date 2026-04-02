import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vigilante')({
  // TODO: Add role check in beforeLoad when roles are implemented (Phase 2)
  // beforeLoad: ({ context }) => {
  //   if (context.auth?.role !== 'VIGILANTE') throw redirect({ to: '/' })
  // },
  component: VigilanteLayout,
})

function VigilanteLayout() {
  // TODO: Replace with tablet-first layout (no sidebar, thumb-zone buttons) in Phase 6
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
