import { createFileRoute, Navigate } from '@tanstack/react-router'

import { Megaphone } from 'lucide-react'

import { useEffectiveComplexRole } from '#/lib/complex-role'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/comunicados',
)({
  component: ComunicadosPage,
})

function ComunicadosPage() {
  const { complexSlug } = Route.useRouteContext()
  const role = useEffectiveComplexRole()
  const isStaff = role === 'ADMIN' || role === 'AUXILIAR'

  if (!isStaff) {
    return (
      <Navigate
        to="/c/$complexSlug/comunicacion/soporte"
        params={{ complexSlug }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Megaphone className="size-12 opacity-40" />
      <p className="text-lg font-medium">Proximamente</p>
      <p className="text-sm">
        Aqui podras enviar comunicados a los residentes.
      </p>
    </div>
  )
}
