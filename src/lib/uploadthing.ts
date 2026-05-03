import { generateReactHelpers } from '@uploadthing/react'

import type { UploadRouter } from '#/routes/api/uploadthing'

const helpers = generateReactHelpers<UploadRouter>({
  url: '/api/uploadthing',
})

export const useUploadThing = helpers.useUploadThing
