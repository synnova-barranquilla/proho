import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: 'https://620848784c815d55ab275ff998042f8b@o4511210135945216.ingest.us.sentry.io/4511210141057024',
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  enableLogs: true,
})
