import { defineSchema, defineTable } from 'convex/server'

import { invitationFields } from './invitations/validators'
import { organizationFields } from './organizations/validators'
import { userFields } from './users/validators'

export default defineSchema({
  organizations: defineTable(organizationFields)
    .index('by_slug', ['slug'])
    .index('by_workos_organization_id', ['workosOrganizationId']),

  users: defineTable(userFields)
    .index('by_email', ['email'])
    .index('by_workos_user_id', ['workosUserId'])
    .index('by_organization_id', ['organizationId'])
    .index('by_organization_id_and_org_role', ['organizationId', 'orgRole']),

  invitations: defineTable(invitationFields)
    .index('by_email_and_status', ['email', 'status'])
    .index('by_organization_id_and_status', ['organizationId', 'status']),
})
