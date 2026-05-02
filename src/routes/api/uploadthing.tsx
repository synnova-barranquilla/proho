import { createFileRoute } from '@tanstack/react-router'

import { createRouteHandler, createUploadthing } from 'uploadthing/server'

const f = createUploadthing()

const uploadRouter = {
  chatAttachment: f({
    image: { maxFileSize: '8MB', maxFileCount: 5 },
    video: { maxFileSize: '32MB', maxFileCount: 2 },
    pdf: { maxFileSize: '8MB', maxFileCount: 5 },
    blob: { maxFileSize: '8MB', maxFileCount: 5 },
  }).onUploadComplete(async ({ file }) => {
    return {
      url: file.ufsUrl,
      key: file.key,
      name: file.name,
      size: file.size,
    }
  }),
}

export type UploadRouter = typeof uploadRouter

const handler = createRouteHandler({ router: uploadRouter })

export const Route = createFileRoute('/api/uploadthing')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
})
