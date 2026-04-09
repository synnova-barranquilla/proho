import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import { toast } from 'sonner'

import { api } from '../../convex/_generated/api'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/_authenticated')({
  // beforeLoad runs SEQUENTIALLY top-down before any `loader` in the tree.
  // We do the entire auth + identity + role check here so that if any
  // guard throws a redirect, NO child loader fires at all — this prevents
  // child routes from firing Convex queries in parallel with an
  // unauthenticated session. (Loaders run in parallel; beforeLoads do not.)
  beforeLoad: async ({ location }) => {
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

    // Pass context through to the loader so it can return it as loader
    // data for child components to consume via getRouteApi().useLoaderData()
    return { workosUser: auth.user, convexUser, organization }
  },
  loader: async ({ context }) => {
    // beforeLoad already did all the validation — just return its result
    // so that children can read it with getRouteApi('/_authenticated').useLoaderData()
    return {
      workosUser: context.workosUser,
      convexUser: context.convexUser,
      organization: context.organization,
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  // Subscribe reactively to getCurrentContext so that if an admin
  // deactivates this user (or their organization) mid-session, we
  // detect it and force a clean logout with a toast — instead of
  // leaving the user stuck on a page calling mutations that suddenly
  // fail with FORBIDDEN.
  //
  // `useQuery` here (not `useSuspenseQuery`) because:
  //   - The initial data is guaranteed (beforeLoad already fetched it
  //     and threw redirect otherwise).
  //   - We want tolerant error handling — suspending on error would
  //     tear the route tree instead of letting the effect redirect.
  const contextQuery = useQuery(
    convexQuery(api.users.queries.getCurrentContext, {}),
  )

  useEffect(() => {
    if (!contextQuery.data) return

    const { user, organization } = contextQuery.data

    if (!user.active) {
      toast.error('Tu usuario fue desactivado', {
        description: `Ya no tienes acceso a ${organization.name}. Cerrando sesión…`,
      })
      // Hard navigation to /logout — the logout route clears the WorkOS
      // session cookie server-side and bounces back to /.
      window.location.href = '/logout'
      return
    }

    if (!organization.active) {
      toast.error('Tu organización fue desactivada', {
        description: `${organization.name} está inactiva. Cerrando sesión…`,
      })
      window.location.href = '/logout'
    }
  }, [contextQuery.data])

  return <Outlet />
}
