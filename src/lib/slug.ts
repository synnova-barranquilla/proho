import { z } from 'zod'

/**
 * Slugs that are reserved and cannot be used by any organization.
 * Must match the server-side reserved list in `convex/organizations/mutations.ts`.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'synnova-internal',
  'demo-conjunto',
  'api',
  'www',
  'admin',
  'app',
  'auth',
  'login',
  'logout',
])

export const SLUG_MIN = 3
export const SLUG_MAX = 40

/**
 * Converts an arbitrary string (usually an organization name) into a
 * URL-safe, DNS-safe slug. Removes diacritics, lowercases, collapses
 * whitespace to dashes, strips invalid characters.
 *
 * `slugify("Conjunto Altos del Prado")` → `"conjunto-altos-del-prado"`
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // strip invalid chars
    .trim()
    .replace(/\s+/g, '-') // spaces → dash
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-|-$/g, '') // trim leading/trailing dashes
    .slice(0, SLUG_MAX)
}

/**
 * Returns true if the given slug is in the reserved list and cannot be
 * used by a new organization.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug)
}

/**
 * Zod schema for client-side slug validation. Format rules match the
 * server-side check in `convex/organizations/mutations.ts::validateSlug`.
 */
export const slugSchema = z
  .string()
  .min(SLUG_MIN, `Mínimo ${SLUG_MIN} caracteres`)
  .max(SLUG_MAX, `Máximo ${SLUG_MAX} caracteres`)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Solo minúsculas, números y guiones (no al inicio/final)',
  )
  .refine((s) => !isReservedSlug(s), 'Este slug está reservado')
