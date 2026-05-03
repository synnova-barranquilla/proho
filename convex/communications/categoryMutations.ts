import { v } from 'convex/values'

import { internalMutation, mutation } from '../_generated/server'
import { requireCommsAccess } from '../lib/auth'
import { ERROR_CODES, throwConvexError } from '../lib/errors'
import {
  PLATFORM_COMPLEX_ID,
  ticketPriorities,
  type AssignedRole,
  type TicketPriority,
} from './validators'

const DEFAULT_CATEGORIES: Array<{
  key: string
  label: string
  priority: TicketPriority
  assignedRole: AssignedRole
  keywords: string[]
}> = [
  {
    key: 'leaks',
    label: 'Fugas y filtraciones',
    priority: 'high',
    assignedRole: 'AUXILIAR',
    keywords: ['fuga', 'filtración', 'goteo', 'humedad', 'agua'],
  },
  {
    key: 'elevator',
    label: 'Ascensor',
    priority: 'high',
    assignedRole: 'AUXILIAR',
    keywords: ['ascensor', 'elevador', 'atrapado'],
  },
  {
    key: 'power',
    label: 'Energía eléctrica',
    priority: 'high',
    assignedRole: 'AUXILIAR',
    keywords: ['luz', 'energía', 'electricidad', 'apagón', 'corte'],
  },
  {
    key: 'security_cameras',
    label: 'Cámaras de seguridad',
    priority: 'high',
    assignedRole: 'AUXILIAR',
    keywords: ['cámara', 'seguridad', 'vigilancia', 'video'],
  },
  {
    key: 'vehicle_permits',
    label: 'Permisos vehiculares',
    priority: 'high',
    assignedRole: 'ADMIN',
    keywords: ['permiso', 'vehículo', 'parqueadero', 'estacionamiento'],
  },
  {
    key: 'lost_packages',
    label: 'Paquetes extraviados',
    priority: 'high',
    assignedRole: 'ADMIN',
    keywords: ['paquete', 'correspondencia', 'extraviado', 'perdido'],
  },
  {
    key: 'recurrent_complaints',
    label: 'Quejas recurrentes',
    priority: 'high',
    assignedRole: 'ADMIN',
    keywords: ['recurrente', 'repetido', 'otra vez'],
  },
  {
    key: 'maintenance',
    label: 'Mantenimiento general',
    priority: 'medium',
    assignedRole: 'AUXILIAR',
    keywords: ['mantenimiento', 'reparación', 'daño', 'arreglo'],
  },
  {
    key: 'low_water_pressure',
    label: 'Baja presión de agua',
    priority: 'medium',
    assignedRole: 'AUXILIAR',
    keywords: ['presión', 'agua', 'baja'],
  },
  {
    key: 'marijuana_odors',
    label: 'Olores y ruido',
    priority: 'medium',
    assignedRole: 'ADMIN',
    keywords: ['olor', 'marihuana', 'ruido', 'bulla', 'música'],
  },
  {
    key: 'social_area_reservations',
    label: 'Reservas zonas sociales',
    priority: 'medium',
    assignedRole: 'ADMIN',
    keywords: ['reserva', 'salón', 'zona social', 'bbq', 'coworking', 'salon'],
  },
  {
    key: 'moving',
    label: 'Mudanzas',
    priority: 'medium',
    assignedRole: 'ADMIN',
    keywords: ['mudanza', 'trasteo', 'traslado'],
  },
  {
    key: 'damage_inquiry',
    label: 'Duda sobre daño',
    priority: 'high',
    assignedRole: 'ADMIN',
    keywords: [
      'daño',
      'responsabilidad',
      'quién paga',
      'reparación',
      'culpa',
      'responsable',
    ],
  },
  {
    key: 'service_cut_paid',
    label: 'Corte de servicios (pagado)',
    priority: 'medium',
    assignedRole: 'ADMIN',
    keywords: ['corte', 'servicio', 'pagado', 'reconexión'],
  },
  {
    key: 'other',
    label: 'Otro',
    priority: 'low',
    assignedRole: 'AUXILIAR',
    keywords: [],
  },
]

const DEFAULT_QUICK_ACTIONS: Array<{
  label: string
  isInfoOnly: boolean
  response?: string
  suggestedCategory?: string
  suggestedPriority?: TicketPriority
}> = [
  {
    label: 'Reportar una fuga o filtración',
    isInfoOnly: false,
    suggestedCategory: 'leaks',
    suggestedPriority: 'high',
  },
  {
    label: 'Problema con el ascensor',
    isInfoOnly: false,
    suggestedCategory: 'elevator',
    suggestedPriority: 'high',
  },
  {
    label: 'Reportar ruido excesivo o malos olores',
    isInfoOnly: false,
    suggestedCategory: 'marijuana_odors',
    suggestedPriority: 'medium',
  },
  {
    label: 'Solicitar información (cuota, paz y salvo)',
    isInfoOnly: true,
    response:
      'Para solicitar información sobre tu cuota de administración o paz y salvo, comunícate con la administración en horario laboral.',
  },
  {
    label: 'Reportar paquete extraviado',
    isInfoOnly: false,
    suggestedCategory: 'lost_packages',
    suggestedPriority: 'high',
  },
  {
    label: 'Otro tema',
    isInfoOnly: false,
    suggestedCategory: 'other',
    suggestedPriority: 'low',
  },
]

export const seedPlatformDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingCategories = await ctx.db
      .query('categories')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
      )
      .collect()

    const existingKeys = new Set(existingCategories.map((c) => c.key))

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i]
      if (existingKeys.has(cat.key)) continue

      await ctx.db.insert('categories', {
        complexId: PLATFORM_COMPLEX_ID,
        key: cat.key,
        label: cat.label,
        priority: cat.priority,
        assignedRole: cat.assignedRole,
        keywords: cat.keywords,
        isSystem: true,
        isEnabled: true,
        displayOrder: i,
      })
    }

    const existingActions = await ctx.db
      .query('quickActions')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', PLATFORM_COMPLEX_ID).eq('isEnabled', true),
      )
      .collect()

    const existingLabels = new Set(existingActions.map((a) => a.label))

    for (let i = 0; i < DEFAULT_QUICK_ACTIONS.length; i++) {
      const action = DEFAULT_QUICK_ACTIONS[i]
      if (existingLabels.has(action.label)) continue

      await ctx.db.insert('quickActions', {
        complexId: PLATFORM_COMPLEX_ID,
        label: action.label,
        response: action.response,
        isInfoOnly: action.isInfoOnly,
        suggestedCategory: action.suggestedCategory,
        suggestedPriority: action.suggestedPriority,
        isSystem: true,
        isEnabled: true,
        displayOrder: i,
      })
    }
  },
})

export const createCategory = mutation({
  args: {
    complexId: v.id('complexes'),
    key: v.string(),
    label: v.string(),
    priority: ticketPriorities,
    assignedRole: v.union(v.literal('AUXILIAR'), v.literal('ADMIN')),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const existing = await ctx.db
      .query('categories')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', args.complexId).eq('isEnabled', true),
      )
      .collect()

    const maxOrder = existing.reduce(
      (max, c) => Math.max(max, c.displayOrder),
      -1,
    )

    const categoryId = await ctx.db.insert('categories', {
      complexId: args.complexId,
      key: args.key,
      label: args.label,
      priority: args.priority,
      assignedRole: args.assignedRole,
      keywords: args.keywords,
      isSystem: false,
      isEnabled: true,
      displayOrder: maxOrder + 1,
    })

    return { categoryId }
  },
})

export const updateCategory = mutation({
  args: {
    categoryId: v.id('categories'),
    label: v.optional(v.string()),
    priority: v.optional(ticketPriorities),
    assignedRole: v.optional(
      v.union(v.literal('AUXILIAR'), v.literal('ADMIN')),
    ),
    keywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)
    if (!category) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Category not found')
    }

    if (category.complexId === '_platform') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot update platform categories directly',
      )
    }

    await requireCommsAccess(ctx, category.complexId, {
      allowedRoles: ['ADMIN'],
    })

    if (category.isSystem) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot update system categories except isEnabled',
      )
    }

    const patch: Record<string, unknown> = {}
    if (args.label !== undefined) patch.label = args.label
    if (args.priority !== undefined) patch.priority = args.priority
    if (args.assignedRole !== undefined) patch.assignedRole = args.assignedRole
    if (args.keywords !== undefined) patch.keywords = args.keywords

    await ctx.db.patch(category._id, patch)

    return { categoryId: category._id }
  },
})

export const toggleCategory = mutation({
  args: {
    categoryId: v.id('categories'),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)
    if (!category) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Category not found')
    }

    if (category.complexId === '_platform') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot toggle platform categories directly',
      )
    }

    await requireCommsAccess(ctx, category.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(category._id, { isEnabled: args.isEnabled })

    return { categoryId: category._id }
  },
})

export const deleteCategory = mutation({
  args: {
    categoryId: v.id('categories'),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId)
    if (!category) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Category not found')
    }

    if (category.complexId === '_platform') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot delete platform categories',
      )
    }

    await requireCommsAccess(ctx, category.complexId, {
      allowedRoles: ['ADMIN'],
    })

    if (category.isSystem) {
      throwConvexError(ERROR_CODES.FORBIDDEN, 'Cannot delete system categories')
    }

    await ctx.db.delete(category._id)

    return { categoryId: category._id }
  },
})

export const createQuickAction = mutation({
  args: {
    complexId: v.id('complexes'),
    label: v.string(),
    response: v.optional(v.string()),
    isInfoOnly: v.boolean(),
    suggestedCategory: v.optional(v.string()),
    suggestedPriority: v.optional(ticketPriorities),
  },
  handler: async (ctx, args) => {
    await requireCommsAccess(ctx, args.complexId, {
      allowedRoles: ['ADMIN'],
    })

    const existing = await ctx.db
      .query('quickActions')
      .withIndex('by_complex', (q) =>
        q.eq('complexId', args.complexId).eq('isEnabled', true),
      )
      .collect()

    const maxOrder = existing.reduce(
      (max, a) => Math.max(max, a.displayOrder),
      -1,
    )

    const quickActionId = await ctx.db.insert('quickActions', {
      complexId: args.complexId,
      label: args.label,
      response: args.response,
      isInfoOnly: args.isInfoOnly,
      suggestedCategory: args.suggestedCategory,
      suggestedPriority: args.suggestedPriority,
      isSystem: false,
      isEnabled: true,
      displayOrder: maxOrder + 1,
    })

    return { quickActionId }
  },
})

export const updateQuickAction = mutation({
  args: {
    quickActionId: v.id('quickActions'),
    label: v.optional(v.string()),
    response: v.optional(v.string()),
    isInfoOnly: v.optional(v.boolean()),
    suggestedCategory: v.optional(v.string()),
    suggestedPriority: v.optional(ticketPriorities),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.quickActionId)
    if (!action) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Quick action not found')
    }

    if (action.complexId === '_platform') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot update platform quick actions directly',
      )
    }

    await requireCommsAccess(ctx, action.complexId, {
      allowedRoles: ['ADMIN'],
    })

    if (action.isSystem) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot update system quick actions',
      )
    }

    const patch: Record<string, unknown> = {}
    if (args.label !== undefined) patch.label = args.label
    if (args.response !== undefined) patch.response = args.response
    if (args.isInfoOnly !== undefined) patch.isInfoOnly = args.isInfoOnly
    if (args.suggestedCategory !== undefined)
      patch.suggestedCategory = args.suggestedCategory
    if (args.suggestedPriority !== undefined)
      patch.suggestedPriority = args.suggestedPriority

    await ctx.db.patch(action._id, patch)

    return { quickActionId: action._id }
  },
})

export const toggleQuickAction = mutation({
  args: {
    quickActionId: v.id('quickActions'),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.quickActionId)
    if (!action) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Quick action not found')
    }

    if (action.complexId === '_platform') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot toggle platform quick actions directly',
      )
    }

    await requireCommsAccess(ctx, action.complexId, {
      allowedRoles: ['ADMIN'],
    })

    await ctx.db.patch(action._id, { isEnabled: args.isEnabled })

    return { quickActionId: action._id }
  },
})

export const deleteQuickAction = mutation({
  args: {
    quickActionId: v.id('quickActions'),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.quickActionId)
    if (!action) {
      throwConvexError(ERROR_CODES.VALIDATION_ERROR, 'Quick action not found')
    }

    if (action.complexId === '_platform') {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot delete platform quick actions',
      )
    }

    await requireCommsAccess(ctx, action.complexId, {
      allowedRoles: ['ADMIN'],
    })

    if (action.isSystem) {
      throwConvexError(
        ERROR_CODES.FORBIDDEN,
        'Cannot delete system quick actions',
      )
    }

    await ctx.db.delete(action._id)

    return { quickActionId: action._id }
  },
})
