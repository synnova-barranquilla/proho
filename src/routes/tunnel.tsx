import { createFileRoute } from '@tanstack/react-router'

const SENTRY_HOST = 'o4511210135945216.ingest.us.sentry.io'
const SENTRY_PROJECT_ID = '4511210141057024'

export const Route = createFileRoute('/tunnel')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text()

        // The envelope header is the first line — contains the DSN
        const header = body.split('\n')[0]
        let envelope: { dsn?: string } = {}
        try {
          envelope = JSON.parse(header)
        } catch {
          return new Response('Invalid envelope', { status: 400 })
        }

        // Validate the DSN points to our Sentry project
        if (!envelope.dsn?.includes(SENTRY_HOST)) {
          return new Response('Invalid DSN', { status: 400 })
        }

        const url = `https://${SENTRY_HOST}/api/${SENTRY_PROJECT_ID}/envelope/`

        const sentryResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-sentry-envelope' },
          body,
        })

        return new Response(sentryResponse.body, {
          status: sentryResponse.status,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
