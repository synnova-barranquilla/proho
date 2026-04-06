import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/no-registrado')({
  component: NoRegistradoPage,
})

function NoRegistradoPage() {
  return (
    <ErrorPage
      title="Cuenta no registrada"
      message="Tu cuenta no está registrada en Synnova. Contacta a la persona que debe invitarte al sistema."
    />
  )
}
