import { Suspense } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { Building2, MapPin } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { prefetchAuthenticatedQuery } from '#/lib/convex-loader'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/seleccionar-conjunto')({
  loader: async ({ context: { queryClient } }) => {
    const conjuntos = await prefetchAuthenticatedQuery(
      queryClient,
      api.conjuntos.queries.listForCurrentUser,
      {},
    )

    // Si solo hay un conjunto accesible, redirect directo.
    if (conjuntos.length === 1) {
      throw redirect({
        to: '/admin/c/$conjuntoId',
        params: { conjuntoId: conjuntos[0]._id },
      })
    }

    return null
  },
  component: SeleccionarConjuntoPage,
})

function SeleccionarConjuntoPage() {
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

        <Suspense fallback={<ConjuntosGridSkeleton />}>
          <ConjuntosGrid />
        </Suspense>
      </div>
    </main>
  )
}

function ConjuntosGrid() {
  const navigate = useNavigate()
  const { data: conjuntos } = useSuspenseQuery(
    convexQuery(api.conjuntos.queries.listForCurrentUser, {}),
  )

  if (conjuntos.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {conjuntos.map((c: Doc<'conjuntos'>) => (
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

function ConjuntosGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="mb-2 h-10 w-10 rounded-md" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
