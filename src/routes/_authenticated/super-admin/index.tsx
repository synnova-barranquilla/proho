import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/super-admin/')({
  component: SuperAdminHome,
})

function SuperAdminHome() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Super Admin</h1>
    </main>
  )
}
