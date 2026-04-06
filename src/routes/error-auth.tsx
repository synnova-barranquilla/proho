import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/error-auth')({
  component: ErrorAuthPage,
})

function ErrorAuthPage() {
  return (
    <ErrorPage
      title="Error de autenticación"
      message="Hubo un problema al iniciar tu sesión. Intenta de nuevo. Si el problema persiste, contacta a soporte."
      primaryAction={{ label: 'Volver a iniciar sesión', to: '/login' }}
    />
  )
}
