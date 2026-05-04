import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/parqueadero/',
)({
  beforeLoad: ({ params: { complexSlug } }) => {
    throw redirect({
      to: '/c/$complexSlug/parqueadero/control-de-acceso',
      params: { complexSlug },
    })
  },
})
