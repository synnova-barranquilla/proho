import { ConvexError } from 'convex/values'

/**
 * Normaliza una placa vehicular: trim, uppercase, sin espacios.
 * Compartida entre vehiculos/mutations y registrosAcceso/mutations.
 */
export function normalizePlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/\s+/g, '')
}

// Formatos oficiales de placa particular en Colombia.
export const PLACA_CARRO_RE = /^[A-Z]{3}\d{3}$/
export const PLACA_MOTO_RE = /^[A-Z]{3}\d{2}[A-Z]$/

export type PlacaTipo = 'CAR' | 'MOTORCYCLE'

export function detectPlacaTipo(placa: string): PlacaTipo | null {
  if (PLACA_CARRO_RE.test(placa)) return 'CAR'
  if (PLACA_MOTO_RE.test(placa)) return 'MOTORCYCLE'
  return null
}

export function isPlacaValida(placa: string): boolean {
  return detectPlacaTipo(placa) !== null
}

export const PLACA_FORMAT_HINT =
  'Formato inválido — Carro: ABC-123 / Moto: ABC-12D'

export function isPlacaValidaParaTipo(
  placa: string,
  tipo: 'CAR' | 'MOTORCYCLE',
): boolean {
  return detectPlacaTipo(placa) === tipo
}

/**
 * Throws a ConvexError if the plate is empty or has an invalid format.
 * Shared by accessRecords and vehicles mutations.
 */
export function requireValidPlate(normalizedPlate: string): void {
  if (!normalizedPlate) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Placa obligatoria',
    })
  }
  if (!isPlacaValida(normalizedPlate)) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Formato de placa inválido',
    })
  }
}
