import { defineSchema, defineTable } from 'convex/server'

import { conjuntoConfigFields } from './conjuntoConfig/validators'
import { conjuntoMembershipFields } from './conjuntoMemberships/validators'
import { conjuntoFields } from './conjuntos/validators'
import { invitationFields } from './invitations/validators'
import { organizationFields } from './organizations/validators'
import { registroAccesoFields } from './registrosAcceso/validators'
import { residenteFields } from './residentes/validators'
import { unidadFields } from './unidades/validators'
import { userFields } from './users/validators'
import { vehiculoFields } from './vehiculos/validators'

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
    .index('by_conjunto_id_and_status', ['conjuntoId', 'status']),

  conjuntos: defineTable(conjuntoFields)
    .index('by_organization_id', ['organizationId'])
    .index('by_organization_id_and_slug', ['organizationId', 'slug']),

  conjuntoMemberships: defineTable(conjuntoMembershipFields)
    .index('by_user_id', ['userId'])
    .index('by_conjunto_id', ['conjuntoId'])
    .index('by_user_and_conjunto', ['userId', 'conjuntoId'])
    .index('by_conjunto_and_role', ['conjuntoId', 'role']),

  conjuntoConfig: defineTable(conjuntoConfigFields).index('by_conjunto_id', [
    'conjuntoId',
  ]),

  unidades: defineTable(unidadFields)
    .index('by_conjunto_id', ['conjuntoId'])
    .index('by_conjunto_id_and_torre', ['conjuntoId', 'torre'])
    .index('by_conjunto_and_torre_and_numero', [
      'conjuntoId',
      'torre',
      'numero',
    ]),

  residentes: defineTable(residenteFields)
    .index('by_conjunto_id', ['conjuntoId'])
    .index('by_unidad_id', ['unidadId'])
    .index('by_conjunto_and_documento', ['conjuntoId', 'numeroDocumento']),

  vehiculos: defineTable(vehiculoFields)
    .index('by_conjunto_id', ['conjuntoId'])
    .index('by_unidad_id', ['unidadId'])
    .index('by_conjunto_and_placa', ['conjuntoId', 'placa']),

  registrosAcceso: defineTable(registroAccesoFields)
    .index('by_conjunto_id', ['conjuntoId'])
    .index('by_conjunto_and_placa', ['conjuntoId', 'placaNormalizada'])
    .index('by_conjunto_and_salida', ['conjuntoId', 'salidaEn'])
    .index('by_conjunto_and_unidad', ['conjuntoId', 'unidadId']),
})
