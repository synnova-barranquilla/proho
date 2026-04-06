import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/invitacion-expirada')({
  component: InvitacionExpiradaPage,
})

function InvitacionExpiradaPage() {
  return (
    <ErrorPage
      title="Invitación expirada"
      message="Tu invitación para acceder a Synnova expiró. Contacta a la persona que te invitó para recibir una nueva."
    />
  )
}
