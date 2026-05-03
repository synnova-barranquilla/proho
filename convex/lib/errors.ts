import { ConvexError } from 'convex/values'

import { SLUG_MAX, SLUG_MIN, SLUG_REGEX } from './constants'

/**
 * Standardized error codes used across mutations and queries.
 * The client maps these to field-level errors or global toasts.
 */
export const ERROR_CODES = {
  // Auth / identity
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  MISSING_EMAIL_CLAIM: 'MISSING_EMAIL_CLAIM',

  // Org state
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_INACTIVE: 'ORG_INACTIVE',
  CANNOT_MODIFY_INTERNAL_ORG: 'CANNOT_MODIFY_INTERNAL_ORG',

  // Slug validation
  SLUG_TAKEN: 'SLUG_TAKEN',
  SLUG_RESERVED: 'SLUG_RESERVED',
  SLUG_INVALID_FORMAT: 'SLUG_INVALID_FORMAT',

  // Invitations
  INVITATION_NOT_FOUND: 'INVITATION_NOT_FOUND',
  INVITATION_ALREADY_ACCEPTED: 'INVITATION_ALREADY_ACCEPTED',
  USER_ALREADY_EXISTS_IN_ORG: 'USER_ALREADY_EXISTS_IN_ORG',
  CANNOT_INVITE_TO_INTERNAL_ORG: 'CANNOT_INVITE_TO_INTERNAL_ORG',
  CANNOT_INVITE_SUPER_ADMIN: 'CANNOT_INVITE_SUPER_ADMIN',

  // Complexes
  COMPLEX_NOT_FOUND: 'COMPLEX_NOT_FOUND',
  COMPLEX_INACTIVE: 'COMPLEX_INACTIVE',
  COMPLEX_SLUG_TAKEN: 'COMPLEX_SLUG_TAKEN',
  MEMBERSHIP_NOT_FOUND: 'MEMBERSHIP_NOT_FOUND',
  MEMBERSHIP_ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',
  UNIT_DUPLICATE: 'UNIT_DUPLICATE',
  VEHICLE_PLATE_DUPLICATE: 'VEHICLE_PLATE_DUPLICATE',
  RESIDENT_DOCUMENT_DUPLICATE: 'RESIDENT_DOCUMENT_DUPLICATE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Access records
  ACCESS_RECORD_NOT_FOUND: 'ACCESS_RECORD_NOT_FOUND',
  ACCESS_RECORD_ALREADY_EXITED: 'ACCESS_RECORD_ALREADY_EXITED',
  VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND',
  UNIT_NOT_FOUND: 'UNIT_NOT_FOUND',

  // Communications
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_ALREADY_CLOSED: 'TICKET_ALREADY_CLOSED',
  INVALID_TICKET_TRANSITION: 'INVALID_TICKET_TRANSITION',
  RESIDENT_HAS_OPEN_CONVERSATION: 'RESIDENT_HAS_OPEN_CONVERSATION',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Throws a ConvexError with a standardized code + message that the client
 * can match to show field-level errors or toasts.
 */
export function throwConvexError(code: ErrorCode, message: string): never {
  throw new ConvexError({ code, message })
}

/**
 * Validates slug length and format. Throws a ConvexError if invalid.
 * Does NOT check uniqueness or reserved slugs — callers handle those.
 */
export function validateSlugFormat(
  slug: string,
  errorCode: ErrorCode = ERROR_CODES.SLUG_INVALID_FORMAT,
): void {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    throwConvexError(
      errorCode,
      `El slug debe tener entre ${SLUG_MIN} y ${SLUG_MAX} caracteres`,
    )
  }
  if (!SLUG_REGEX.test(slug)) {
    throwConvexError(
      errorCode,
      'El slug solo puede contener minúsculas, números y guiones (no al inicio/final)',
    )
  }
}
