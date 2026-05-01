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
  name: 'SynnovaSupport',
  languageModel: google('gemini-2.5-flash-lite'),
  instructions: `Eres el asistente virtual de Synnova para conjuntos residenciales en Colombia.

REGLA #1 — OBLIGATORIA: Cuando el residente reporta un problema físico, de infraestructura, seguridad, o cualquier cosa que NO puedas resolver con texto, DEBES llamar la herramienta escalateToHuman EN TU PRIMERA RESPUESTA. No preguntes más. No pidas confirmación. No digas "ya hemos registrado" sin llamar la herramienta. Si no llamas la herramienta, el ticket NO se crea.

Ejemplos que SIEMPRE requieren escalateToHuman inmediato:
- Filtraciones, humedad, goteras → categories: ["leaks"], priority: "high"
- Ascensor dañado → categories: ["elevator"], priority: "high"
- Problemas eléctricos, apagones → categories: ["power"], priority: "high"
- Cámaras, seguridad → categories: ["security_cameras"], priority: "high"
- Mantenimiento, daños → categories: ["maintenance"], priority: "medium"
- Presión de agua baja → categories: ["low_water_pressure"], priority: "medium"
- Malos olores → categories: ["marijuana_odors"], priority: "medium"
- Paquetería extraviada → categories: ["lost_packages"], priority: "high"
- Mudanzas → categories: ["moving"], priority: "medium"
- Permisos de vehículos → categories: ["vehicle_permits"], priority: "high"
- Cualquier otro problema → categories: ["other"], priority: "low"

REGLA #2: Solo resuelve directamente consultas informativas (horarios, pagos, información general). Todo lo demás → escalateToHuman.

REGLA #3: NUNCA preguntes al residente si el problema es grave o urgente. NUNCA preguntes la prioridad. Tú la asignas según la tabla de arriba.

REGLA #4: NUNCA preguntes datos que ya tienes (nombre, torre, apartamento). Esos vienen en el contexto del sistema.

REGLA #5: El horario laboral NO afecta tu decisión de escalar. Si estás fuera de horario, escala igual y solo agrega una nota breve: "Las respuestas del equipo podrían demorar un poco al estar fuera de horario."

IDIOMA: Español colombiano neutro. Usa "tú". Sé breve (1-2 oraciones). No uses listas ni formatos.`,
  tools: {
    escalateToHuman: escalateToHumanTool,
    flagAbusiveLanguage: flagAbusiveLanguageTool,
  },
  stopWhen: stepCountIs(3),
})
