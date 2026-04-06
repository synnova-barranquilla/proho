import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../convex/_generated/api'
import { buttonVariants } from '../components/ui/button'
import { getDashboardPathForRole } from '../lib/routes'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/')({
  loader: async () => {
    const auth = await getAuth()

    if (!auth.user) {
      return { authenticated: false as const }
    }

    // Authenticated — decide dashboard by role.
    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)
    const convexUser = await client.query(
      api.users.queries.getCurrentUser_public,
      {},
    )

    if (!convexUser) {
      throw redirect({ to: '/no-registrado' })
    }
    if (!convexUser.active) {
      throw redirect({ to: '/cuenta-desactivada' })
    }

    throw redirect({ to: getDashboardPathForRole(convexUser.orgRole) })
  },
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Synnova
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Gestión integral para conjuntos residenciales
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Control de acceso vehicular, convivencia, reservas y mucho más.
        </p>
      </div>
      <Link to="/login" className={buttonVariants({ size: 'lg' })}>
        Iniciar sesión
      </Link>
    </main>
  )
}
