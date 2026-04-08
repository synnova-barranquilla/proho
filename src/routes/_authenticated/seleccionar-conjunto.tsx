import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { getAuth } from '@workos/authkit-tanstack-react-start'
import { ConvexHttpClient } from 'convex/browser'
import { Building2, MapPin } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL

export const Route = createFileRoute('/_authenticated/seleccionar-conjunto')({
  loader: async () => {
    // Cargamos los conjuntos directamente con un HTTP client autenticado
    // y los pasamos por loaderData en lugar de usar useSuspenseQuery/Suspense.
    // Esto evita un problema de hidratación entre SSR y cliente donde la
    // caché de react-query no se hidrata correctamente y `useSuspenseQuery`
    // vuelve a suspender en el cliente causando un hydration mismatch
    // (React minified error #520).
    const auth = await getAuth()
    if (!auth.user) {
      throw redirect({ to: '/login' })
    }

    const client = new ConvexHttpClient(CONVEX_URL)
    client.setAuth(auth.accessToken)

    const conjuntos = await client.query(
      api.conjuntos.queries.listForCurrentUser,
      {},
    )

    if (conjuntos.length === 1) {
      throw redirect({
        to: '/admin/c/$conjuntoId',
        params: { conjuntoId: conjuntos[0]._id },
      })
    }

    return { conjuntos }
  },
  component: SeleccionarConjuntoPage,
})

function SeleccionarConjuntoPage() {
  const { conjuntos } = Route.useLoaderData()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Selecciona un conjunto
          </h1>
          <p className="text-muted-foreground">
            Elige el conjunto residencial que vas a administrar.
          </p>
        </div>

        {conjuntos.length === 0 ? (
          <EmptyState />
        ) : (
          <ConjuntosGrid conjuntos={conjuntos} />
        )}
      </div>
    </main>
  )
}

function ConjuntosGrid({ conjuntos }: { conjuntos: Array<Doc<'conjuntos'>> }) {
  const navigate = useNavigate()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {conjuntos.map((c) => (
        <button
          key={c._id}
          type="button"
          onClick={() =>
            navigate({
              to: '/admin/c/$conjuntoId',
              params: { conjuntoId: c._id },
            })
          }
          className="group text-left"
        >
          <Card className="transition-colors hover:border-primary/50 hover:bg-accent/40">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{c.nombre}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {c.direccion}, {c.ciudad}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Abrir panel del conjunto →
              </p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>Sin conjuntos asignados</CardTitle>
        <CardDescription>
          Todavía no tienes acceso a ningún conjunto. Si eres el owner de la
          organización, puedes crear uno nuevo. Si no, contacta al administrador
          de tu organización para que te asigne acceso.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-xs text-muted-foreground">
        La gestión del equipo de la organización se habilitará en el siguiente
        paso (F4.27).
      </CardContent>
    </Card>
  )
}
