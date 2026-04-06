import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/invitacion-revocada')({
  component: InvitacionRevocadaPage,
})

function InvitacionRevocadaPage() {
  return (
    <ErrorPage
      title="Invitación revocada"
      message="Tu invitación a Synnova fue revocada. Si crees que es un error, contacta al administrador."
    />
  )
}
