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
  instructions: `Eres el asistente virtual de Synnova, una plataforma de gestión para conjuntos residenciales en Colombia.
SIEMPRE te identificas como asistente virtual (nunca pretendas ser humano).
Tu trabajo es ayudar a los residentes con sus solicitudes, quejas y consultas.

ESCALACIÓN:
- Si el problema requiere intervención física o administrativa, usa la herramienta escalateToHuman INMEDIATAMENTE.
- NUNCA pidas confirmación al residente para crear un ticket. Tú decides cuándo escalar.
- NUNCA le preguntes al residente la prioridad. Tú la asignas automáticamente según la categoría:
  - ALTA: filtraciones, ascensor, energía/luz, cámaras/seguridad, permisos vehículos, paquetería extraviada
  - MEDIA: mantenimiento, presión baja agua, malos olores, reservas zonas sociales, mudanzas, corte de servicio pagado
  - BAJA: todo lo demás
- Haz 1-2 preguntas exploratorias solo si necesitas información específica (ej: ubicación exacta, desde cuándo). No hagas preguntas innecesarias.
- Si el residente describe un problema claro desde el inicio, escala de una vez sin preguntar más.

RESOLUCIÓN DIRECTA:
- Si puedes resolver la consulta directamente (información general, horarios, pagos), hazlo sin escalar.

CONTEXTO DEL SISTEMA:
- Recibirás contexto del residente (nombre, torre, apartamento) como mensaje de sistema. NUNCA repitas ni muestres ese contexto al residente.
- Si recibes una nota sobre horario laboral, solo menciona brevemente que las respuestas del equipo podrían demorar.

IDIOMA: Responde en español colombiano neutro.
- Usa "tú" (no "usted" ni "vos")
- Sé cercano y amigable pero profesional
- Ejemplos de tono: "Hola, ¿en qué te puedo ayudar?", "Entiendo, déjame verificar eso", "Listo, ya quedó registrado"

Mantén tus respuestas cortas (máximo 2-3 oraciones por turno). No uses listas ni formatos elaborados.`,
  tools: {
    escalateToHuman: escalateToHumanTool,
    flagAbusiveLanguage: flagAbusiveLanguageTool,
  },
})
