'use node'

import { render } from '@react-email/components'
import { v } from 'convex/values'

import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { sendEmail } from './send'
import { DailySummaryEmail } from './templates/dailySummary'
import { InvitationEmail } from './templates/invitation'

/**
 * Send invitation email when a user is invited to a conjunto or organization.
 * Triggered via ctx.scheduler.runAfter from invitations.create mutation.
 */
export const sendInvitationEmail = internalAction({
  args: {
    invitationId: v.id('invitations'),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(
      internal.email.helpers.getInvitationData,
      { invitationId: args.invitationId },
    )

    if (!invitation) {
      console.error(`Invitation ${args.invitationId} not found`)
      return
    }

    const loginUrl = process.env.SITE_URL
      ? `${process.env.SITE_URL}/login`
      : 'https://app.synnova.com.co/login'

    const rolLabel = invitation.conjuntoRole ?? invitation.orgRole

    const html = await render(
      InvitationEmail({
        nombreInvitado: invitation.firstName,
        nombreConjunto:
          invitation.conjuntoNombre ?? invitation.orgNombre ?? 'Synnova',
        rolInvitado: rolLabel,
        loginUrl,
      }),
    )

    await sendEmail({
      to: invitation.email,
      subject: `Has sido invitado a ${invitation.conjuntoNombre ?? invitation.orgNombre ?? 'Synnova'}`,
      html,
    })
  },
})

/**
 * Send daily summary email to all conjunto admins.
 * Triggered by a daily cron at 11:00 UTC (6am COT).
 */
export const sendDailySummary = internalAction({
  args: {},
  handler: async (ctx) => {
    const conjuntoSummaries = await ctx.runQuery(
      internal.email.helpers.getAllConjuntoSummaries,
      {},
    )

    const siteUrl = process.env.SITE_URL ?? 'https://app.synnova.com.co'

    for (const summary of conjuntoSummaries) {
      // Skip conjuntos with no activity
      if (
        summary.stats.ingresosAyer === 0 &&
        summary.stats.salidasAyer === 0 &&
        summary.stats.rechazosAyer === 0
      ) {
        continue
      }

      const html = await render(
        DailySummaryEmail({
          nombreConjunto: summary.conjuntoNombre,
          fecha: summary.fecha,
          vehiculosDentro: summary.stats.vehiculosDentro,
          ingresosAyer: summary.stats.ingresosAyer,
          salidasAyer: summary.stats.salidasAyer,
          rechazosAyer: summary.stats.rechazosAyer,
          historicoUrl: `${siteUrl}/c/${summary.conjuntoSlug}/control-acceso`,
        }),
      )

      for (const adminEmail of summary.adminEmails) {
        await sendEmail({
          to: adminEmail,
          subject: `Resumen de ayer — ${summary.conjuntoNombre}`,
          html,
        })
      }
    }
  },
})
