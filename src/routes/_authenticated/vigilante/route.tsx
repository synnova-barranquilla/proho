import { createFileRoute, Outlet } from '@tanstack/react-router'

// Role guard is enforced in the parent `_authenticated` loader. In F2,
// vigilantes do not exist yet (they require conjuntoMemberships from F4),
// so the parent loader always rejects /vigilante/* with /no-autorizado.
export const Route = createFileRoute('/_authenticated/vigilante')({
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
