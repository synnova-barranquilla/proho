import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * `/admin` es solo un punto de entrada. El usuario siempre pasa por el
 * selector, que decide (según 0/1/N conjuntos accesibles) dónde mandarlo.
 */
export const Route = createFileRoute('/_authenticated/admin/')({
  loader: () => {
    throw redirect({ to: '/seleccionar-conjunto' })
  },
})
