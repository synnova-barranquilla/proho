import { v } from 'convex/values'

import { mutation } from '../_generated/server'
import { requireCommsAccess } from '../lib/auth'

const ALL_COMMS_ROLES = [
  'ADMIN',
  'AUXILIAR',
  'OWNER',
  'TENANT',
  'LESSEE',
] as const

export const saveAttachment = mutation({
  args: {
    complexId: v.id('complexes'),
    conversationId: v.id('conversations'),
    fileName: v.string(),
    fileUrl: v.string(),
    fileKey: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: [...ALL_COMMS_ROLES],
    })

    return await ctx.db.insert('attachments', {
      ...args,
      uploadedByUserId: user._id,
      createdAt: Date.now(),
    })
  },
})
