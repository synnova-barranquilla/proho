import { ConvexError } from 'convex/values'

/**
 * Normalizes a vehicle plate: trim, uppercase, no spaces.
 * Shared between vehicles/mutations and accessRecords/mutations.
 */
export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, '')
}

/** All Colombian civilian plates are exactly 6 characters (e.g. ABC123, ABC12D). */
export const PLATE_LENGTH = 6

// Official Colombian private plate formats.
export const PLATE_CAR_RE = /^[A-Z]{3}\d{3}$/
export const PLATE_MOTO_RE = /^[A-Z]{3}\d{2}[A-Z]$/

export type PlateType = 'CAR' | 'MOTORCYCLE'

export function detectPlateType(plate: string): PlateType | null {
  if (PLATE_CAR_RE.test(plate)) return 'CAR'
  if (PLATE_MOTO_RE.test(plate)) return 'MOTORCYCLE'
  return null
}

export function isValidPlate(plate: string): boolean {
  return detectPlateType(plate) !== null
}

export const PLATE_FORMAT_HINT =
  'Formato inválido — Carro: ABC-123 / Moto: ABC-12D'

export function isValidPlateForType(
  plate: string,
  type: 'CAR' | 'MOTORCYCLE',
): boolean {
  return detectPlateType(plate) === type
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
  if (!isValidPlate(normalizedPlate)) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Formato de placa inválido',
    })
  }
}
