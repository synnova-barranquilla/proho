import { v } from 'convex/values'

import { internal } from '../_generated/api'
import { mutation } from '../_generated/server'
import { requireComplexAccess } from '../lib/auth'
import { SEVEN_DAYS_MS } from '../lib/constants'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import { documentType, residentTypes } from './validators'

const RESIDENT_TYPE_TO_COMPLEX_ROLE = {
  OWNER: 'OWNER',
  LESSEE: 'LESSEE',
  TENANT: 'TENANT',
} as const

export const create = mutation({
  args: {
    unitId: v.id('units'),
    firstName: v.string(),
    lastName: v.string(),
    documentType,
    documentNumber: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    type: residentTypes,
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId)
    if (!unit) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Unidad no encontrada')
    }
    const { user, complex } = await requireComplexAccess(ctx, unit.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const firstName = args.firstName.trim()
    const lastName = args.lastName.trim()
    const documentNumber = args.documentNumber.trim()
    if (!firstName || !lastName || !documentNumber) {
      throwConvexError(
        ERROR_CODES.VALIDATION_ERROR,
        'Nombres, apellidos y número de documento son obligatorios',
      )
    }

    const existing = await ctx.db
      .query('residents')
      .withIndex('by_complex_and_document', (q) =>
        q.eq('complexId', unit.complexId).eq('documentNumber', documentNumber),
      )
      .first()
    if (existing) {
      throwConvexError(
        ERROR_CODES.RESIDENT_DOCUMENT_DUPLICATE,
        `Ya existe un residente con el documento ${documentNumber}`,
      )
    }

    const residentId = await ctx.db.insert('residents', {
      complexId: unit.complexId,
      unitId: args.unitId,
      firstName,
      lastName,
      documentType: args.documentType,
      documentNumber,
      phone: args.phone?.trim() || undefined,
      email: args.email?.trim() || undefined,
      type: args.type,
      active: true,
    })

    const email = args.email?.trim()
    if (email) {
      const complexRole = RESIDENT_TYPE_TO_COMPLEX_ROLE[args.type]

      const previousPending = await ctx.db
        .query('invitations')
        .withIndex('by_email_and_status', (q) =>
          q.eq('email', email).eq('status', 'PENDING'),
        )
        .collect()
      for (const prev of previousPending) {
        if (prev.organizationId === complex.organizationId) {
          await ctx.db.patch(prev._id, { status: 'REVOKED' })
        }
      }

      const now = Date.now()
      const invitationId = await ctx.db.insert('invitations', {
        email,
        firstName,
        lastName,
        orgRole: 'MEMBER',
        organizationId: complex.organizationId,
        status: 'PENDING',
        invitedBy: user._id,
        invitedAt: now,
        expiresAt: now + SEVEN_DAYS_MS,
        complexId: unit.complexId,
        complexRole,
        residentId,
      })

      await ctx.scheduler.runAfter(
        0,
        internal.email.actions.sendInvitationEmail,
        { invitationId },
      )
    }

    return { residentId }
  },
})

export const update = mutation({
  args: {
    residentId: v.id('residents'),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    type: residentTypes,
  },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId)
    if (!resident) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Residente no encontrado')
    }
    await requireComplexAccess(ctx, resident.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.residentId, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      phone: args.phone?.trim() || undefined,
      email: args.email?.trim() || undefined,
      type: args.type,
    })
    return { success: true }
  },
})

export const setActive = mutation({
  args: {
    residentId: v.id('residents'),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const resident = await ctx.db.get(args.residentId)
    if (!resident) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Residente no encontrado')
    }
    await requireComplexAccess(ctx, resident.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(args.residentId, { active: args.active })
    return { success: true }
  },
})
