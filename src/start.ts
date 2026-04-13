import { createStart } from '@tanstack/react-start'

import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from '@sentry/tanstackstart-react'
import { authkitMiddleware } from '@workos/authkit-tanstack-react-start'

export const startInstance = createStart(() => ({
  requestMiddleware: [sentryGlobalRequestMiddleware, authkitMiddleware()],
  functionMiddleware: [sentryGlobalFunctionMiddleware],
}))
