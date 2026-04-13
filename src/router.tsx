import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import * as Sentry from '@sentry/tanstackstart-react'

import { getQueryClient } from './integrations/convex/provider'
import AppProviders from './integrations/providers'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = getQueryClient()

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 150,
    Wrap: AppProviders,
  })

  if (!router.isServer) {
    Sentry.init({
      dsn: 'https://620848784c815d55ab275ff998042f8b@o4511210135945216.ingest.us.sentry.io/4511210141057024',
      tunnel: '/tunnel',
      sendDefaultPii: true,
      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      enableLogs: true,
    })
  }

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
