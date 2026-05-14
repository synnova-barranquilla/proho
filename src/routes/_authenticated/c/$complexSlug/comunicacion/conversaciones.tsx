import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/conversaciones',
)({
  component: ConversacionesRedirect,
})

function ConversacionesRedirect() {
  const { complexSlug } = Route.useRouteContext()
  return (
    <Navigate
      to="/c/$complexSlug/comunicacion/soporte"
      params={{ complexSlug }}
    />
  )
}
