/**
 * Format helpers for Colombian domain fields.
 *
 * Convention: storage is always the canonical (unformatted) value:
 *   - phone: digits only (`3001234567`)
 *   - document (cédula): digits only (`1234567`)
 *   - placa: uppercase, no hyphen (`ABC123`, `ABC12D`)
 *
 * The `format*` functions produce a display string from canonical.
 * The `parse*` functions strip formatting back to canonical and clamp length.
 */

// --- Phone ----------------------------------------------------------------
// Colombian mobile: 10 digits, grouped 3-3-4 ("300 123 4567").

export function parsePhone(input: string): string {
  return input.replace(/\D/g, '').slice(0, 10)
}

export function formatPhone(raw: string): string {
  const d = parsePhone(raw)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

// --- Document (cédula) ----------------------------------------------------
// Digits only, grouped in thousands with dots from the right ("1.234.567").

export function parseDocument(input: string): string {
  return input.replace(/\D/g, '').slice(0, 12)
}

export function formatDocument(raw: string): string {
  const d = parseDocument(raw)
  if (d.length === 0) return ''
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// --- Placa ----------------------------------------------------------------
// Car:   ABC123  (3 letters + 3 digits)    → display "ABC-123"
// Moto:  ABC12D  (3 letters + 2 digits + 1 letter) → display "ABC-12D"
// Storage is uppercase, no hyphen. Max 6 chars.

export function parsePlaca(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}

export function formatPlaca(raw: string): string {
  const p = parsePlaca(raw)
  if (p.length <= 3) return p
  return `${p.slice(0, 3)}-${p.slice(3)}`
}

// --- Duracion ---------------------------------------------------------------

export function formatDuracion(enteredAt: number | undefined): string {
  if (enteredAt == null) return '—'
  const diff = Date.now() - enteredAt
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return '< 1m'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return `${days}d ${remainHours}h`
}
