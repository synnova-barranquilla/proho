import { ConvexError } from 'convex/values'

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
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Throws a ConvexError with a standardized code + message that the client
 * can match to show field-level errors or toasts.
 */
export function throwConvexError(code: ErrorCode, message: string): never {
  throw new ConvexError({ code, message })
}
