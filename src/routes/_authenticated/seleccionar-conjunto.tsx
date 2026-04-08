import { createFileRoute, redirect } from '@tanstack/react-router'

import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'

import { api } from '../../../convex/_generated/api'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

// DIAGNOSTIC BUILD — F4 debugging.
// Stripped down to the absolute minimum to bisect the prod 500 issue.
// The parent _authenticated.beforeLoad already handles auth; here we do
// a minimal Convex call and return a primitive value. If this still 500s
// in prod, the problem is in the SSR/streaming pipeline; if it works,
// we gradually add complexity back to identify the trigger.
export const Route = createFileRoute('/_authenticated/seleccionar-conjunto')({
  loader: async () => {
    console.log('[seleccionar-conjunto] loader start')
    const auth = await getAuth()
    if (!auth.user) {
      console.log('[seleccionar-conjunto] no user, redirect to login')
      throw redirect({ to: '/login' })
    }
    console.log('[seleccionar-conjunto] auth ok')

    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)

    const conjuntos = await client.query(
      api.conjuntos.queries.listForCurrentUser,
      {},
    )
    console.log('[seleccionar-conjunto] conjuntos fetched', {
      count: conjuntos.length,
    })

    // Return a plain primitive count — no objects, no arrays of Convex docs.
    // This isolates whether serialization of Doc<'conjuntos'> is the problem.
    return { count: conjuntos.length }
  },
  component: SeleccionarConjuntoPage,
})

function SeleccionarConjuntoPage() {
  const { count } = Route.useLoaderData()
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Diagnostic mode</h1>
        <p className="mt-2 text-muted-foreground">conjuntos count: {count}</p>
      </div>
    </main>
  )
}
