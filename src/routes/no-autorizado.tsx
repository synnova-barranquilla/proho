import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/no-autorizado')({
  component: NoAutorizadoPage,
})

function NoAutorizadoPage() {
  return (
    <ErrorPage
      title="Acceso denegado"
      message="No tienes permisos para acceder a esta sección."
      primaryAction={{ label: 'Volver al inicio', to: '/' }}
    />
  )
}
