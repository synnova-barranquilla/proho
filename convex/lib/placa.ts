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

export type PlacaTipo = 'CARRO' | 'MOTO'

export function detectPlacaTipo(placa: string): PlacaTipo | null {
  if (PLACA_CARRO_RE.test(placa)) return 'CARRO'
  if (PLACA_MOTO_RE.test(placa)) return 'MOTO'
  return null
}

export function isPlacaValida(placa: string): boolean {
  return detectPlacaTipo(placa) !== null
}

export function isPlacaValidaParaTipo(
  placa: string,
  tipo: 'CARRO' | 'MOTO',
): boolean {
  return detectPlacaTipo(placa) === tipo
}
