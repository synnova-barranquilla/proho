import { v } from 'convex/values'

import { internalQuery } from '../_generated/server'

/**
 * Get invitation data for the email template.
 */
export const getInvitationData = internalQuery({
  args: { invitationId: v.id('invitations') },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) return null

    const org = await ctx.db.get(invitation.organizationId)

    let conjuntoNombre: string | undefined
    if (invitation.conjuntoId) {
      const conjunto = await ctx.db.get(invitation.conjuntoId)
      conjuntoNombre = conjunto?.nombre
    }

    return {
      email: invitation.email,
      firstName: invitation.firstName,
      orgRole: invitation.orgRole,
      conjuntoRole: invitation.conjuntoRole,
      orgNombre: org?.name,
      conjuntoNombre,
    }
  },
})

/**
 * Get summaries for all active conjuntos (used by daily summary cron).
 */
export const getAllConjuntoSummaries = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all organizations
    const orgs = await ctx.db.query('organizations').collect()
    const activeOrgs = orgs.filter((o) => o.active)

    const summaries: Array<{
      conjuntoNombre: string
      conjuntoSlug: string
      fecha: string
      stats: {
        vehiculosDentro: number
        ingresosAyer: number
        salidasAyer: number
        novedadesAyer: number
        rechazosAyer: number
      }
      novedades: Array<{ hora: string; descripcion: string }>
      adminEmails: string[]
    }> = []

    // Yesterday range
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000

    const fechaLabel = new Date(startOfYesterday).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    for (const org of activeOrgs) {
      const conjuntos = await ctx.db
        .query('conjuntos')
        .withIndex('by_organization_id', (q) => q.eq('organizationId', org._id))
        .collect()

      for (const conjunto of conjuntos.filter((c) => c.active)) {
        // Get registros
        const registros = await ctx.db
          .query('registrosAcceso')
          .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
          .collect()

        const vehiculosDentro = registros.filter(
          (r) => r.salidaEn === undefined && r.decisionFinal === 'PERMITIDO',
        ).length

        const ayer = registros.filter(
          (r) =>
            r._creationTime >= startOfYesterday &&
            r._creationTime < startOfToday,
        )

        const ingresosAyer = ayer.filter(
          (r) => r.entradaEn != null && r.decisionFinal === 'PERMITIDO',
        ).length
        const salidasAyer = ayer.filter((r) => r.salidaEn != null).length
        const rechazosAyer = ayer.filter(
          (r) => r.decisionFinal === 'RECHAZADO',
        ).length

        // Novedades
        const novedadesAll = await ctx.db
          .query('novedades')
          .withIndex('by_conjunto_id', (q) => q.eq('conjuntoId', conjunto._id))
          .collect()

        const novedadesAyer = novedadesAll.filter(
          (n) => n.creadoEn >= startOfYesterday && n.creadoEn < startOfToday,
        )

        // Admin emails
        const memberships = await ctx.db
          .query('conjuntoMemberships')
          .withIndex('by_conjunto_and_role', (q) =>
            q.eq('conjuntoId', conjunto._id).eq('role', 'ADMIN'),
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
          conjuntoNombre: conjunto.nombre,
          conjuntoSlug: conjunto.slug,
          fecha: fechaLabel,
          stats: {
            vehiculosDentro,
            ingresosAyer,
            salidasAyer,
            novedadesAyer: novedadesAyer.length,
            rechazosAyer,
          },
          novedades: novedadesAyer.map((n) => ({
            hora: new Date(n.creadoEn).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            descripcion: n.descripcion,
          })),
          adminEmails,
        })
      }
    }

    return summaries
  },
})
