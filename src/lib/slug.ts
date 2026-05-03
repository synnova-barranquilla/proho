import { z } from 'zod'

import { RESERVED_SLUGS, SLUG_MAX, SLUG_MIN } from '../../convex/lib/constants'

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
    .replace(/[̀-ͯ]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // strip invalid chars
    .trim()
    .replace(/\s+/g, '-') // spaces → dash
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-|-$/g, '') // trim leading/trailing dashes
    .slice(0, SLUG_MAX)
}

function isReservedSlug(slug: string): boolean {
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
