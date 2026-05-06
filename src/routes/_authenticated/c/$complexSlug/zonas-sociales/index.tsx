import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/zonas-sociales/',
)({
  beforeLoad: ({ params: { complexSlug } }) => {
    throw redirect({
      to: '/c/$complexSlug/zonas-sociales/reservas',
      params: { complexSlug },
    })
  },
})
