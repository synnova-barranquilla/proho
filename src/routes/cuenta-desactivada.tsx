import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/cuenta-desactivada')({
  component: CuentaDesactivadaPage,
})

function CuentaDesactivadaPage() {
  return (
    <ErrorPage
      title="Cuenta desactivada"
      message="Tu cuenta ha sido desactivada. Contacta al administrador si necesitas recuperar el acceso."
    />
  )
}
