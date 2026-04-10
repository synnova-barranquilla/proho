/**
 * Normaliza una placa vehicular: trim, uppercase, sin espacios.
 * Compartida entre vehiculos/mutations y registrosAcceso/mutations.
 */
export function normalizePlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/\s+/g, '')
}
