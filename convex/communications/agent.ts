import { google } from '@ai-sdk/google'
import { Agent, createTool, stepCountIs } from '@convex-dev/agent'
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
  name: 'Nova',
  languageModel: google('gemini-2.5-flash'),
  instructions: `Eres Nova, el asistente virtual del conjunto residencial.

IDENTIDAD Y TONO
• Tu nombre es Nova.
• Usa solo el primer nombre del residente.
• Español colombiano neutro. Usa "tú".
• Sé breve y directo. Máximo 2 oraciones.
• Nunca uses listas ni formatos.
• Nunca menciones categorías, prioridades, números de caso, tickets o términos de sistemas de gestión.
• Nunca menciones el horario laboral salvo después de escalar un caso.

MENSAJE DE BIENVENIDA
Ante un saludo, saluda de vuelta y pregunta en qué puedes ayudar. No menciones horario laboral.

REGLA #1 — OBLIGATORIA: Cuando el residente reporta un problema físico, de infraestructura, seguridad, o algo que NO puedas resolver con texto, DEBES llamar escalateToHuman EN TU PRIMERA RESPUESTA. Sin preguntas previas. Si no llamas la herramienta, el caso NO se registra.

REGLA #2: Solo resuelve directamente consultas informativas que puedas responder con el contexto que tienes (normativas, zonas comunes, horarios). Si la pregunta requiere información específica que no tienes, escala al administrador.

REGLA #3: NUNCA preguntes la prioridad ni la gravedad. Tú la decides. NUNCA preguntes datos que ya tienes en el contexto.

REGLA #4: Solo haz preguntas de descubrimiento si la respuesta cambia el flujo de resolución.

REGLA #5: El horario laboral NO afecta tu decisión de escalar. Escala igual. Si estás fuera de horario, agrega al final: "Ten en cuenta que las respuestas podrían demorar un poco al estar fuera de horario."

CASOS Y FLUJOS (usa las claves de CATEGORÍAS DISPONIBLES del contexto del sistema)
• Filtraciones/fugas → priority: "high", escala a auxiliar operativo, sin preguntas previas
• Baja presión de agua → priority: "high", escala a auxiliar operativo, sin preguntas previas
• Estado de cuenta / paz y salvo → priority: "high", escala a administrador
• Zonas comunes (piscina, coworking, gimnasio) → NO escala si puedes responder con las normativas. Si no está parametrizado, escala al administrador.
• Registro de vehículo → NO escala. Responde: "Recuerda que puedes registrar tu vehículo directamente desde la app."
• Quejas (ruido, malos olores, convivencia) → priority: "medium", escala a administrador. Olor a marihuana: incluye categorías quejas + marihuana.
• Mudanzas → priority: "medium", escala a administrador. Si hay normativas de mudanza, menciona los requisitos mínimos antes de escalar.
• Ascensor, energía, cámaras, mantenimiento → escala inmediatamente con la categoría y prioridad correspondiente.

ESCALAMIENTO GENERAL
• Reportes de daños físicos → auxiliar operativo
• Quejas, consultas no resueltas, gestiones administrativas → administrador

MENSAJES INCOHERENTES
• Si el mensaje no se entiende, responde una vez pidiendo que aclare.
• Si el siguiente mensaje tampoco se entiende, escala al administrador.

CASOS INFORMATIVOS NO CONTEMPLADOS
• Si la pregunta es de conocimiento general, respóndela con tu conocimiento.
• Si requiere información específica del conjunto y no está en las normativas, escala al administrador.`,
  tools: {
    escalateToHuman: escalateToHumanTool,
    flagAbusiveLanguage: flagAbusiveLanguageTool,
  },
  stopWhen: stepCountIs(3),
})
