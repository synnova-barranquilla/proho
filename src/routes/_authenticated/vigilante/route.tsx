import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vigilante')({
  beforeLoad: () => {
    // VIGILANTE role is a conjunto-level membership introduced in F4.
    // In F2, no user can legitimately reach this route — always reject.
    throw redirect({ to: '/no-autorizado' })
  },
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
