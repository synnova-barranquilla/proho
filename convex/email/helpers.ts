import { v } from 'convex/values'

import { internalQuery } from '../_generated/server'
import { MS_PER_DAY } from '../lib/constants'

/**
 * Get invitation data for the email template.
 */
export const getInvitationData = internalQuery({
  args: { invitationId: v.id('invitations') },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) return null

    const org = await ctx.db.get(invitation.organizationId)

    let complexName: string | undefined
    if (invitation.complexId) {
      const complex = await ctx.db.get(invitation.complexId)
      complexName = complex?.name
    }

    return {
      email: invitation.email,
      firstName: invitation.firstName,
      orgRole: invitation.orgRole,
      complexRole: invitation.complexRole,
      orgName: org?.name,
      complexName,
    }
  },
})

/**
 * Get summaries for all active complexes (used by daily summary cron).
 */
export const getAllComplexSummaries = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all organizations
    const orgs = await ctx.db.query('organizations').collect()
    const activeOrgs = orgs.filter((o) => o.active)

    const summaries: Array<{
      complexName: string
      complexSlug: string
      fecha: string
      stats: {
        vehiclesInside: number
        entriesYesterday: number
        exitsYesterday: number
        rejectsYesterday: number
      }
      adminEmails: string[]
    }> = []

    // Yesterday range
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const startOfYesterday = startOfToday - MS_PER_DAY

    const fechaLabel = new Date(startOfYesterday).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    for (const org of activeOrgs) {
      const complexes = await ctx.db
        .query('complexes')
        .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
        .collect()

      for (const complex of complexes.filter((c) => c.active)) {
        // Get records
        const records = await ctx.db
          .query('accessRecords')
          .withIndex('by_complex_id', (q) => q.eq('complexId', complex._id))
          .collect()

        const vehiclesInside = records.filter(
          (r) => r.exitedAt === undefined && r.finalDecision === 'ALLOWED',
        ).length

        const yesterday = records.filter(
          (r) =>
            r._creationTime >= startOfYesterday &&
            r._creationTime < startOfToday,
        )

        const entriesYesterday = yesterday.filter(
          (r) => r.enteredAt != null && r.finalDecision === 'ALLOWED',
        ).length
        const exitsYesterday = yesterday.filter(
          (r) => r.exitedAt != null,
        ).length
        const rejectsYesterday = yesterday.filter(
          (r) => r.finalDecision === 'REJECTED',
        ).length

        // Admin emails
        const memberships = await ctx.db
          .query('complexMemberships')
          .withIndex('by_complex_and_role', (q) =>
            q.eq('complexId', complex._id).eq('role', 'ADMIN'),
          )
          .collect()

        const activeAdminMemberships = memberships.filter((m) => m.active)
        const adminEmails: string[] = []
        for (const m of activeAdminMemberships) {
          const user = await ctx.db.get(m.userId)
          if (user?.active && user.email) {
            adminEmails.push(user.email)
          }
        }

        // Also include org owners
        const orgUsers = await ctx.db
          .query('users')
          .withIndex('by_organization_id', (q) =>
            q.eq('organizationId', org._id),
          )
          .collect()
        for (const u of orgUsers) {
          if (
            u.active &&
            u.isOrgOwner &&
            u.email &&
            !adminEmails.includes(u.email)
          ) {
            adminEmails.push(u.email)
          }
        }

        if (adminEmails.length === 0) continue

        summaries.push({
          complexName: complex.name,
          complexSlug: complex.slug,
          fecha: fechaLabel,
          stats: {
            vehiclesInside,
            entriesYesterday,
            exitsYesterday,
            rejectsYesterday,
          },
          adminEmails,
        })
      }
    }

    return summaries
  },
})
