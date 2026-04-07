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
import type * as invitations_mutations from '../invitations/mutations.js'
import type * as invitations_queries from '../invitations/queries.js'
import type * as invitations_validators from '../invitations/validators.js'
import type * as lib_auth from '../lib/auth.js'
import type * as lib_errors from '../lib/errors.js'
import type * as lib_organizations from '../lib/organizations.js'
import type * as organizations_mutations from '../organizations/mutations.js'
import type * as organizations_queries from '../organizations/queries.js'
import type * as organizations_validators from '../organizations/validators.js'
import type * as seed from '../seed.js'
import type * as users_queries from '../users/queries.js'
import type * as users_validators from '../users/validators.js'

declare const fullApi: ApiFromModules<{
  'auth/mutations': typeof auth_mutations
  'invitations/mutations': typeof invitations_mutations
  'invitations/queries': typeof invitations_queries
  'invitations/validators': typeof invitations_validators
  'lib/auth': typeof lib_auth
  'lib/errors': typeof lib_errors
  'lib/organizations': typeof lib_organizations
  'organizations/mutations': typeof organizations_mutations
  'organizations/queries': typeof organizations_queries
  'organizations/validators': typeof organizations_validators
  seed: typeof seed
  'users/queries': typeof users_queries
  'users/validators': typeof users_validators
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
