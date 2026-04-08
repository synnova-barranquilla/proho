import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../convex/_generated/api'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/_authenticated')({
  loader: async ({ location }) => {
    const auth = await getAuth()

    if (!auth.user) {
      const signInUrl = await getSignInUrl({
        data: { returnPathname: location.pathname },
      })
      throw redirect({ href: signInUrl })
    }

    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)

    const context = await client.query(api.users.queries.getCurrentContext, {})

    if (!context) {
      throw redirect({ to: '/no-registrado' })
    }

    const { user: convexUser, organization } = context

    if (!convexUser.active) {
      throw redirect({ to: '/cuenta-desactivada' })
    }
    if (!organization.active) {
      throw redirect({ to: '/organizacion-inactiva' })
    }

    // Path-based role check. Centralized here because TanStack Router does
    // not pipe parent loader data through child `beforeLoad` context.
    const path = location.pathname
    if (
      path.startsWith('/super-admin') &&
      convexUser.orgRole !== 'SUPER_ADMIN'
    ) {
      throw redirect({ to: '/no-autorizado' })
    }
    if (path.startsWith('/admin') && convexUser.orgRole !== 'ADMIN') {
      throw redirect({ to: '/no-autorizado' })
    }
    // /vigilante/* requiere user autenticado con orgRole ADMIN (los VIGILANTE
    // se modelan como users con orgRole='ADMIN' pero cuya autorización real
    // vive en conjuntoMemberships). El loader del segmento c/$conjuntoId se
    // encarga de validar la membership específica.
    if (path.startsWith('/vigilante') && convexUser.orgRole !== 'ADMIN') {
      throw redirect({ to: '/no-autorizado' })
    }

    return { workosUser: auth.user, convexUser, organization }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
