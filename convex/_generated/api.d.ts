/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server'

import type * as auth_mutations from '../auth/mutations.js'
import type * as conjuntoConfig_mutations from '../conjuntoConfig/mutations.js'
import type * as conjuntoConfig_queries from '../conjuntoConfig/queries.js'
import type * as conjuntoConfig_validators from '../conjuntoConfig/validators.js'
import type * as conjuntoMemberships_mutations from '../conjuntoMemberships/mutations.js'
import type * as conjuntoMemberships_queries from '../conjuntoMemberships/queries.js'
import type * as conjuntoMemberships_validators from '../conjuntoMemberships/validators.js'
import type * as conjuntos_mutations from '../conjuntos/mutations.js'
import type * as conjuntos_queries from '../conjuntos/queries.js'
import type * as conjuntos_validators from '../conjuntos/validators.js'
import type * as crons from '../crons.js'
import type * as email_actions from '../email/actions.js'
import type * as email_helpers from '../email/helpers.js'
import type * as email_send from '../email/send.js'
import type * as email_templates_dailySummary from '../email/templates/dailySummary.js'
import type * as email_templates_invitation from '../email/templates/invitation.js'
import type * as email_templates_layout from '../email/templates/layout.js'
import type * as invitations_mutations from '../invitations/mutations.js'
import type * as invitations_queries from '../invitations/queries.js'
import type * as invitations_validators from '../invitations/validators.js'
import type * as lib_auth from '../lib/auth.js'
import type * as lib_errors from '../lib/errors.js'
import type * as lib_organizations from '../lib/organizations.js'
import type * as lib_placa from '../lib/placa.js'
import type * as lib_rulesEngine from '../lib/rulesEngine.js'
import type * as migrations_fixUserNames from '../migrations/fixUserNames.js'
import type * as organizations_mutations from '../organizations/mutations.js'
import type * as organizations_queries from '../organizations/queries.js'
import type * as organizations_validators from '../organizations/validators.js'
import type * as registrosAcceso_mutations from '../registrosAcceso/mutations.js'
import type * as registrosAcceso_queries from '../registrosAcceso/queries.js'
import type * as registrosAcceso_validators from '../registrosAcceso/validators.js'
import type * as residentes_mutations from '../residentes/mutations.js'
import type * as residentes_queries from '../residentes/queries.js'
import type * as residentes_validators from '../residentes/validators.js'
import type * as seed from '../seed.js'
import type * as unidades_mutations from '../unidades/mutations.js'
import type * as unidades_queries from '../unidades/queries.js'
import type * as unidades_validators from '../unidades/validators.js'
import type * as users_mutations from '../users/mutations.js'
import type * as users_queries from '../users/queries.js'
import type * as users_validators from '../users/validators.js'
import type * as vehiculos_mutations from '../vehiculos/mutations.js'
import type * as vehiculos_queries from '../vehiculos/queries.js'
import type * as vehiculos_validators from '../vehiculos/validators.js'

declare const fullApi: ApiFromModules<{
  'auth/mutations': typeof auth_mutations
  'conjuntoConfig/mutations': typeof conjuntoConfig_mutations
  'conjuntoConfig/queries': typeof conjuntoConfig_queries
  'conjuntoConfig/validators': typeof conjuntoConfig_validators
  'conjuntoMemberships/mutations': typeof conjuntoMemberships_mutations
  'conjuntoMemberships/queries': typeof conjuntoMemberships_queries
  'conjuntoMemberships/validators': typeof conjuntoMemberships_validators
  'conjuntos/mutations': typeof conjuntos_mutations
  'conjuntos/queries': typeof conjuntos_queries
  'conjuntos/validators': typeof conjuntos_validators
  crons: typeof crons
  'email/actions': typeof email_actions
  'email/helpers': typeof email_helpers
  'email/send': typeof email_send
  'email/templates/dailySummary': typeof email_templates_dailySummary
  'email/templates/invitation': typeof email_templates_invitation
  'email/templates/layout': typeof email_templates_layout
  'invitations/mutations': typeof invitations_mutations
  'invitations/queries': typeof invitations_queries
  'invitations/validators': typeof invitations_validators
  'lib/auth': typeof lib_auth
  'lib/errors': typeof lib_errors
  'lib/organizations': typeof lib_organizations
  'lib/placa': typeof lib_placa
  'lib/rulesEngine': typeof lib_rulesEngine
  'migrations/fixUserNames': typeof migrations_fixUserNames
  'organizations/mutations': typeof organizations_mutations
  'organizations/queries': typeof organizations_queries
  'organizations/validators': typeof organizations_validators
  'registrosAcceso/mutations': typeof registrosAcceso_mutations
  'registrosAcceso/queries': typeof registrosAcceso_queries
  'registrosAcceso/validators': typeof registrosAcceso_validators
  'residentes/mutations': typeof residentes_mutations
  'residentes/queries': typeof residentes_queries
  'residentes/validators': typeof residentes_validators
  seed: typeof seed
  'unidades/mutations': typeof unidades_mutations
  'unidades/queries': typeof unidades_queries
  'unidades/validators': typeof unidades_validators
  'users/mutations': typeof users_mutations
  'users/queries': typeof users_queries
  'users/validators': typeof users_validators
  'vehiculos/mutations': typeof vehiculos_mutations
  'vehiculos/queries': typeof vehiculos_queries
  'vehiculos/validators': typeof vehiculos_validators
}>

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>

export declare const components: {}
