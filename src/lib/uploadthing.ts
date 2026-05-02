import { generateReactHelpers } from '@uploadthing/react'

import type { UploadRouter } from '#/routes/api/uploadthing'

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>({
    url: '/api/uploadthing',
  })
