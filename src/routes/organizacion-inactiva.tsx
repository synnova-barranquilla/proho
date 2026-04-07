import { createFileRoute } from '@tanstack/react-router'

import { ErrorPage } from '../components/error-page'

export const Route = createFileRoute('/organizacion-inactiva')({
  component: OrganizacionInactivaPage,
})

function OrganizacionInactivaPage() {
  return (
    <ErrorPage
      title="Organización inactiva"
      message="La organización a la que perteneces está actualmente inactiva. Si crees que esto es un error, contacta al administrador del sistema."
    />
  )
}
