import { defineSchema, defineTable } from 'convex/server'

import {
  organizationFields,
  organizationModuleFields,
} from './organizations/validators'
import { userFields } from './users/validators'

export default defineSchema({
  organizations: defineTable(organizationFields).index('by_slug', ['slug']),

  organizationModules: defineTable(organizationModuleFields)
    .index('by_organization_id', ['organizationId'])
    .index('by_organization_id_and_module_key', [
      'organizationId',
      'moduleKey',
    ]),

  users: defineTable(userFields)
    .index('by_email', ['email'])
    .index('by_workos_user_id', ['workosUserId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_organization_id_and_role', ['organizationId', 'role']),
})
