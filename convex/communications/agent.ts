import { google } from '@ai-sdk/google'
import { Agent, createTool } from '@convex-dev/agent'
import { z } from 'zod'

import { components } from '../_generated/api'

export const escalateToHumanTool = createTool({
  description:
    'Escala la conversación a un humano creando un ticket de soporte. Usa esta herramienta cuando el problema del residente requiere intervención humana, no puedes resolverlo directamente, o el residente lo solicita explícitamente.',
  inputSchema: z.object({
    categories: z
      .array(z.string())
      .describe(
        'Categorías del problema (ej: leaks, elevator, maintenance, other)',
      ),
    priority: z
      .enum(['high', 'medium', 'low'])
      .describe('Prioridad según la urgencia del problema'),
    summary: z
      .string()
      .describe('Resumen breve del problema reportado por el residente'),
  }),
  execute: async (ctx, args) => {
    const threadId = ctx.threadId
    if (!threadId) {
      return { success: false, error: 'No thread context available' }
    }

    // The actual ticket creation is handled by the action that called the agent.
    // We return the escalation data so the calling action can process it.
    return {
      success: true,
      escalated: true,
      categories: args.categories,
      priority: args.priority,
      summary: args.summary,
    }
  },
})

export const flagAbusiveLanguageTool = createTool({
  description:
    'Marca la conversación por lenguaje abusivo, amenazante o inapropiado. Usa esta herramienta cuando el residente use lenguaje ofensivo o amenazante.',
  inputSchema: z.object({
    reason: z
      .string()
      .describe(
        'Descripción breve de por qué el contenido se considera abusivo',
      ),
  }),
  execute: async (_ctx, args) => {
    return {
      success: true,
      flagged: true,
      reason: args.reason,
    }
  },
})

export const supportAgent = new Agent(components.agent, {
  name: 'SynnovaSupport',
  languageModel: google('gemini-2.5-flash-lite'),
  instructions: `Eres el asistente de soporte de Synnova para un conjunto residencial.
SIEMPRE te identificas como un asistente virtual (nunca pretendas ser humano).
Tu trabajo es recopilar contexto sobre el problema del residente a través de preguntas exploratorias.
Después de entender el problema, clasifícalo y escala a un humano si es necesario.
Si el tema tiene respuesta directa (información de pagos, horarios, etc.), resuélvelo sin crear ticket.
Responde en español. Sé profesional pero amigable.
Mantén tus respuestas concisas (máximo 2-3 oraciones por turno).`,
  tools: {
    escalateToHuman: escalateToHumanTool,
    flagAbusiveLanguage: flagAbusiveLanguageTool,
  },
})
