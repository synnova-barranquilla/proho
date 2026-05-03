import { z } from 'zod'

import { MODULE_KEYS } from '../modules'
import { slugSchema } from '../slug'

const moduleKeySchema = z.enum(MODULE_KEYS)

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Mínimo 2 caracteres')
  .max(80, 'Máximo 80 caracteres')

const firstNameSchema = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .max(40, 'Máximo 40 caracteres')

const lastNameSchema = z
  .string()
  .trim()
  .max(40, 'Máximo 40 caracteres')
  .optional()
  .or(z.literal('').transform(() => undefined))

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .email('Email no válido')

/**
 * Schema for the "Nueva organización" onboarding dialog.
 * Validates the combined org + initial admin fields atomically.
 */
export const onboardTenantSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  activeModules: z.array(moduleKeySchema),
  adminEmail: emailSchema,
  adminFirstName: firstNameSchema,
  adminLastName: lastNameSchema,
})
export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>

/**
 * Schema for editing an organization's name.
 */
export const updateOrgSchema = z.object({
  name: nameSchema,
})
/**
 * Schema for inviting an admin to an existing organization.
 * `organizationId` may be pre-set by the caller (when invoked from an org
 * context) or chosen in the form (when invoked from the users page).
 */
export const inviteAdminSchema = z.object({
  organizationId: z.string().min(1, 'Selecciona una organización'),
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
})
export type InviteAdminInput = z.infer<typeof inviteAdminSchema>
