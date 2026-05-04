import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/c/$complexSlug/comunicacion/',
)({
  beforeLoad: ({ params: { complexSlug } }) => {
    throw redirect({
      to: '/c/$complexSlug/comunicacion/soporte',
      params: { complexSlug },
    })
  },
})
