import { defineSchema, defineTable } from 'convex/server'

import { accessRecordFields } from './accessRecords/validators'
import {
  attachmentFields,
  categoryFields,
  conversationFields,
  quickActionFields,
  ticketEventFields,
  ticketFields,
  ticketNoteFields,
} from './communications/validators'
import { complexConfigFields } from './complexConfig/validators'
import { complexFields } from './complexes/validators'
import { complexMembershipFields } from './complexMemberships/validators'
import { invitationFields } from './invitations/validators'
import { organizationFields } from './organizations/validators'
import { residentFields } from './residents/validators'
import {
  socialZoneBookingFields,
  socialZoneDateBlockFields,
  socialZoneFields,
} from './socialZones/validators'
import { unitFields } from './units/validators'
import { userFields } from './users/validators'
import { vehicleFields } from './vehicles/validators'

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
    .index('by_organization_id_and_status', ['organizationId', 'status'])
    .index('by_complex_id_and_status', ['complexId', 'status']),

  complexes: defineTable(complexFields)
    .index('by_organization_id', ['organizationId'])
    .index('by_organization_id_and_slug', ['organizationId', 'slug']),

  complexMemberships: defineTable(complexMembershipFields)
    .index('by_user_id', ['userId'])
    .index('by_complex_id', ['complexId'])
    .index('by_user_and_complex', ['userId', 'complexId'])
    .index('by_complex_and_role', ['complexId', 'role']),

  complexConfig: defineTable(complexConfigFields).index('by_complex_id', [
    'complexId',
  ]),

  units: defineTable(unitFields)
    .index('by_complex_id', ['complexId'])
    .index('by_complex_and_tower', ['complexId', 'tower'])
    .index('by_complex_and_tower_and_number', ['complexId', 'tower', 'number']),

  residents: defineTable(residentFields)
    .index('by_complex_id', ['complexId'])
    .index('by_unit_id', ['unitId'])
    .index('by_complex_and_document', ['complexId', 'documentNumber']),

  vehicles: defineTable(vehicleFields)
    .index('by_complex_id', ['complexId'])
    .index('by_unit_id', ['unitId'])
    .index('by_complex_and_plate', ['complexId', 'plate']),

  accessRecords: defineTable(accessRecordFields)
    .index('by_complex_id', ['complexId'])
    .index('by_complex_and_plate', ['complexId', 'normalizedPlate'])
    .index('by_complex_and_exit', ['complexId', 'exitedAt'])
    .index('by_complex_and_unit', ['complexId', 'unitId']),

  conversations: defineTable(conversationFields)
    .index('by_complex', ['complexId'])
    .index('by_resident_and_status', ['residentId', 'status'])
    .index('by_complex_and_status', ['complexId', 'status']),

  tickets: defineTable(ticketFields)
    .index('by_complex', ['complexId'])
    .index('by_complex_and_status', ['complexId', 'status'])
    .index('by_complex_and_publicId', ['complexId', 'publicId'])
    .index('by_complex_and_priority', ['complexId', 'priority', 'status'])
    .index('by_resident', ['residentId'])
    .index('by_complex_and_updatedAt', ['complexId', 'updatedAt'])
    .index('by_conversation', ['conversationId']),

  ticketEvents: defineTable(ticketEventFields).index('by_ticket', [
    'ticketId',
    'createdAt',
  ]),

  ticketNotes: defineTable(ticketNoteFields).index('by_ticket', [
    'ticketId',
    'createdAt',
  ]),

  categories: defineTable(categoryFields).index('by_complex', [
    'complexId',
    'isEnabled',
    'displayOrder',
  ]),

  quickActions: defineTable(quickActionFields).index('by_complex', [
    'complexId',
    'isEnabled',
    'displayOrder',
  ]),

  attachments: defineTable(attachmentFields)
    .index('by_conversation', ['conversationId', 'createdAt'])
    .index('by_complex', ['complexId', 'createdAt']),

  socialZones: defineTable(socialZoneFields).index('by_complex_id', [
    'complexId',
  ]),

  socialZoneBookings: defineTable(socialZoneBookingFields)
    .index('by_zone_and_date', ['zoneId', 'date'])
    .index('by_complex_and_date', ['complexId', 'date'])
    .index('by_resident', ['residentId']),

  socialZoneDateBlocks: defineTable(socialZoneDateBlockFields).index(
    'by_complex_and_date',
    ['complexId', 'date'],
  ),
})
