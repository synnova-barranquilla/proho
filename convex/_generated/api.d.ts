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

import type * as accessRecords_mutations from '../accessRecords/mutations.js'
import type * as accessRecords_queries from '../accessRecords/queries.js'
import type * as accessRecords_validators from '../accessRecords/validators.js'
import type * as auth_mutations from '../auth/mutations.js'
import type * as communications_categoryMutations from '../communications/categoryMutations.js'
import type * as communications_mutations from '../communications/mutations.js'
import type * as communications_queries from '../communications/queries.js'
import type * as communications_validators from '../communications/validators.js'
import type * as complexConfig_mutations from '../complexConfig/mutations.js'
import type * as complexConfig_queries from '../complexConfig/queries.js'
import type * as complexConfig_validators from '../complexConfig/validators.js'
import type * as complexes_mutations from '../complexes/mutations.js'
import type * as complexes_queries from '../complexes/queries.js'
import type * as complexes_validators from '../complexes/validators.js'
import type * as complexMemberships_mutations from '../complexMemberships/mutations.js'
import type * as complexMemberships_queries from '../complexMemberships/queries.js'
import type * as complexMemberships_validators from '../complexMemberships/validators.js'
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
import type * as residents_mutations from '../residents/mutations.js'
import type * as residents_queries from '../residents/queries.js'
import type * as residents_validators from '../residents/validators.js'
import type * as seed from '../seed.js'
import type * as units_mutations from '../units/mutations.js'
import type * as units_queries from '../units/queries.js'
import type * as units_validators from '../units/validators.js'
import type * as users_mutations from '../users/mutations.js'
import type * as users_queries from '../users/queries.js'
import type * as users_validators from '../users/validators.js'
import type * as vehicles_mutations from '../vehicles/mutations.js'
import type * as vehicles_queries from '../vehicles/queries.js'
import type * as vehicles_validators from '../vehicles/validators.js'

declare const fullApi: ApiFromModules<{
  'accessRecords/mutations': typeof accessRecords_mutations
  'accessRecords/queries': typeof accessRecords_queries
  'accessRecords/validators': typeof accessRecords_validators
  'auth/mutations': typeof auth_mutations
  'communications/categoryMutations': typeof communications_categoryMutations
  'communications/mutations': typeof communications_mutations
  'communications/queries': typeof communications_queries
  'communications/validators': typeof communications_validators
  'complexConfig/mutations': typeof complexConfig_mutations
  'complexConfig/queries': typeof complexConfig_queries
  'complexConfig/validators': typeof complexConfig_validators
  'complexMemberships/mutations': typeof complexMemberships_mutations
  'complexMemberships/queries': typeof complexMemberships_queries
  'complexMemberships/validators': typeof complexMemberships_validators
  'complexes/mutations': typeof complexes_mutations
  'complexes/queries': typeof complexes_queries
  'complexes/validators': typeof complexes_validators
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
  'residents/mutations': typeof residents_mutations
  'residents/queries': typeof residents_queries
  'residents/validators': typeof residents_validators
  seed: typeof seed
  'units/mutations': typeof units_mutations
  'units/queries': typeof units_queries
  'units/validators': typeof units_validators
  'users/mutations': typeof users_mutations
  'users/queries': typeof users_queries
  'users/validators': typeof users_validators
  'vehicles/mutations': typeof vehicles_mutations
  'vehicles/queries': typeof vehicles_queries
  'vehicles/validators': typeof vehicles_validators
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
