import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/vigilante/')({
  component: VigilanteHome,
})

function VigilanteHome() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Vigilante</h1>
    </main>
  )
}
