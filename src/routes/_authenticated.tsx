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

    return { workosUser: auth.user, convexUser }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
