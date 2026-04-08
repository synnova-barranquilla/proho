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
    console.log('[seleccionar-conjunto] auth ok', {
      hasToken: !!auth.accessToken,
      tokenPreview: auth.accessToken.slice(0, 20),
    })

    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)

    console.log('[seleccionar-conjunto] about to query listForCurrentUser')

    let conjuntos
    try {
      conjuntos = await client.query(
        api.conjuntos.queries.listForCurrentUser,
        {},
      )
    } catch (err) {
      // Capture the exact error so we can see what Convex is returning.
      // Without this try/catch the error propagates silently and Nitro
      // returns a generic 500 with no server-side log.
      const errorInfo = {
        name: err instanceof Error ? err.name : 'unknown',
        message: err instanceof Error ? err.message : String(err),
        data: (err as { data?: unknown }).data,
        stack:
          err instanceof Error && err.stack
            ? err.stack.slice(0, 500)
            : undefined,
      }
      console.error(
        '[seleccionar-conjunto] client.query threw',
        JSON.stringify(errorInfo),
      )
      // Re-throw so the loader still fails and we see the 500 — but now
      // with the error logged.
      throw err
    }

    console.log('[seleccionar-conjunto] conjuntos fetched', {
      count: conjuntos.length,
    })

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
