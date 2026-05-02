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
import type * as communications_actions from '../communications/actions.js'
import type * as communications_agent from '../communications/agent.js'
import type * as communications_attachmentMutations from '../communications/attachmentMutations.js'
import type * as communications_businessHours from '../communications/businessHours.js'
import type * as communications_categoryMutations from '../communications/categoryMutations.js'
import type * as communications_helpers from '../communications/helpers.js'
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
  'communications/actions': typeof communications_actions
  'communications/agent': typeof communications_agent
  'communications/attachmentMutations': typeof communications_attachmentMutations
  'communications/businessHours': typeof communications_businessHours
  'communications/categoryMutations': typeof communications_categoryMutations
  'communications/helpers': typeof communications_helpers
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

export declare const components: {
  agent: {
    apiKeys: {
      destroy: FunctionReference<
        'mutation',
        'internal',
        { apiKey?: string; name?: string },
        | 'missing'
        | 'deleted'
        | 'name mismatch'
        | 'must provide either apiKey or name'
      >
      issue: FunctionReference<
        'mutation',
        'internal',
        { name?: string },
        string
      >
      validate: FunctionReference<
        'query',
        'internal',
        { apiKey: string },
        boolean
      >
    }
    files: {
      addFile: FunctionReference<
        'mutation',
        'internal',
        {
          filename?: string
          hash: string
          mediaType?: string
          mimeType?: string
          storageId: string
        },
        { fileId: string; storageId: string }
      >
      copyFile: FunctionReference<
        'mutation',
        'internal',
        { fileId: string },
        null
      >
      deleteFiles: FunctionReference<
        'mutation',
        'internal',
        { fileIds: Array<string>; force?: boolean },
        Array<string>
      >
      get: FunctionReference<
        'query',
        'internal',
        { fileId: string },
        null | {
          _creationTime: number
          _id: string
          filename?: string
          hash: string
          lastTouchedAt: number
          mediaType?: string
          mimeType?: string
          refcount: number
          storageId: string
        }
      >
      getFilesToDelete: FunctionReference<
        'query',
        'internal',
        {
          paginationOpts: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
        },
        {
          continueCursor: string
          isDone: boolean
          page: Array<{
            _creationTime: number
            _id: string
            filename?: string
            hash: string
            lastTouchedAt: number
            mediaType?: string
            mimeType?: string
            refcount: number
            storageId: string
          }>
        }
      >
      useExistingFile: FunctionReference<
        'mutation',
        'internal',
        { filename?: string; hash: string },
        null | { fileId: string; storageId: string }
      >
    }
    messages: {
      addMessages: FunctionReference<
        'mutation',
        'internal',
        {
          agentName?: string
          embeddings?: {
            dimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096
            model: string
            vectors: Array<Array<number> | null>
          }
          failPendingSteps?: boolean
          finishStreamId?: string
          hideFromUserIdSearch?: boolean
          messages: Array<{
            error?: string
            fileIds?: Array<string>
            finishReason?:
              | 'stop'
              | 'length'
              | 'content-filter'
              | 'tool-calls'
              | 'error'
              | 'other'
              | 'unknown'
            message:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            image: string | ArrayBuffer
                            mediaType?: string
                            mimeType?: string
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'image'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'user'
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            signature?: string
                            text: string
                            type: 'reasoning'
                          }
                        | {
                            data: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'redacted-reasoning'
                          }
                        | {
                            args?: any
                            input: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args: any
                            input?: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args?: any
                            experimental_content?: Array<
                              | { text: string; type: 'text' }
                              | {
                                  data: string
                                  mimeType?: string
                                  type: 'image'
                                }
                            >
                            isError?: boolean
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  reason?: string
                                  type: 'execution-denied'
                                }
                              | {
                                  type: 'content'
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        text: string
                                        type: 'text'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        type: 'media'
                                      }
                                    | {
                                        data: string
                                        filename?: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-id'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-file-id'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'custom'
                                      }
                                  >
                                }
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            result?: any
                            toolCallId: string
                            toolName: string
                            type: 'tool-result'
                          }
                        | {
                            id: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'url'
                            title?: string
                            type: 'source'
                            url: string
                          }
                        | {
                            filename?: string
                            id: string
                            mediaType: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'document'
                            title: string
                            type: 'source'
                          }
                        | {
                            approvalId: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            type: 'tool-approval-request'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'assistant'
                }
              | {
                  content: Array<
                    | {
                        args?: any
                        experimental_content?: Array<
                          | { text: string; type: 'text' }
                          | { data: string; mimeType?: string; type: 'image' }
                        >
                        isError?: boolean
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              reason?: string
                              type: 'execution-denied'
                            }
                          | {
                              type: 'content'
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    text: string
                                    type: 'text'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    type: 'media'
                                  }
                                | {
                                    data: string
                                    filename?: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-id'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-file-id'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'custom'
                                  }
                              >
                            }
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        result?: any
                        toolCallId: string
                        toolName: string
                        type: 'tool-result'
                      }
                    | {
                        approvalId: string
                        approved: boolean
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        reason?: string
                        type: 'tool-approval-response'
                      }
                  >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'tool'
                }
              | {
                  content: string
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'system'
                }
            model?: string
            provider?: string
            providerMetadata?: Record<string, Record<string, any>>
            reasoning?: string
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  signature?: string
                  text: string
                  type: 'reasoning'
                }
              | { signature?: string; text: string; type: 'text' }
              | { data: string; type: 'redacted' }
            >
            sources?: Array<
              | {
                  id: string
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  sourceType: 'url'
                  title?: string
                  type?: 'source'
                  url: string
                }
              | {
                  filename?: string
                  id: string
                  mediaType: string
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  sourceType: 'document'
                  title: string
                  type: 'source'
                }
            >
            status?: 'pending' | 'success' | 'failed'
            text?: string
            usage?: {
              cachedInputTokens?: number
              completionTokens: number
              promptTokens: number
              reasoningTokens?: number
              totalTokens: number
            }
            warnings?: Array<
              | {
                  details?: string
                  setting: string
                  type: 'unsupported-setting'
                }
              | { details?: string; tool: any; type: 'unsupported-tool' }
              | { message: string; type: 'other' }
            >
          }>
          pendingMessageId?: string
          promptMessageId?: string
          threadId: string
          userId?: string
        },
        {
          messages: Array<{
            _creationTime: number
            _id: string
            agentName?: string
            embeddingId?: string
            error?: string
            fileIds?: Array<string>
            finishReason?:
              | 'stop'
              | 'length'
              | 'content-filter'
              | 'tool-calls'
              | 'error'
              | 'other'
              | 'unknown'
            id?: string
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            image: string | ArrayBuffer
                            mediaType?: string
                            mimeType?: string
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'image'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'user'
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            signature?: string
                            text: string
                            type: 'reasoning'
                          }
                        | {
                            data: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'redacted-reasoning'
                          }
                        | {
                            args?: any
                            input: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args: any
                            input?: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args?: any
                            experimental_content?: Array<
                              | { text: string; type: 'text' }
                              | {
                                  data: string
                                  mimeType?: string
                                  type: 'image'
                                }
                            >
                            isError?: boolean
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  reason?: string
                                  type: 'execution-denied'
                                }
                              | {
                                  type: 'content'
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        text: string
                                        type: 'text'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        type: 'media'
                                      }
                                    | {
                                        data: string
                                        filename?: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-id'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-file-id'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'custom'
                                      }
                                  >
                                }
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            result?: any
                            toolCallId: string
                            toolName: string
                            type: 'tool-result'
                          }
                        | {
                            id: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'url'
                            title?: string
                            type: 'source'
                            url: string
                          }
                        | {
                            filename?: string
                            id: string
                            mediaType: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'document'
                            title: string
                            type: 'source'
                          }
                        | {
                            approvalId: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            type: 'tool-approval-request'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'assistant'
                }
              | {
                  content: Array<
                    | {
                        args?: any
                        experimental_content?: Array<
                          | { text: string; type: 'text' }
                          | { data: string; mimeType?: string; type: 'image' }
                        >
                        isError?: boolean
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              reason?: string
                              type: 'execution-denied'
                            }
                          | {
                              type: 'content'
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    text: string
                                    type: 'text'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    type: 'media'
                                  }
                                | {
                                    data: string
                                    filename?: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-id'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-file-id'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'custom'
                                  }
                              >
                            }
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        result?: any
                        toolCallId: string
                        toolName: string
                        type: 'tool-result'
                      }
                    | {
                        approvalId: string
                        approved: boolean
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        reason?: string
                        type: 'tool-approval-response'
                      }
                  >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'tool'
                }
              | {
                  content: string
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'system'
                }
            model?: string
            order: number
            provider?: string
            providerMetadata?: Record<string, Record<string, any>>
            providerOptions?: Record<string, Record<string, any>>
            reasoning?: string
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  signature?: string
                  text: string
                  type: 'reasoning'
                }
              | { signature?: string; text: string; type: 'text' }
              | { data: string; type: 'redacted' }
            >
            sources?: Array<
              | {
                  id: string
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  sourceType: 'url'
                  title?: string
                  type?: 'source'
                  url: string
                }
              | {
                  filename?: string
                  id: string
                  mediaType: string
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  sourceType: 'document'
                  title: string
                  type: 'source'
                }
            >
            status: 'pending' | 'success' | 'failed'
            stepOrder: number
            text?: string
            threadId: string
            tool: boolean
            usage?: {
              cachedInputTokens?: number
              completionTokens: number
              promptTokens: number
              reasoningTokens?: number
              totalTokens: number
            }
            userId?: string
            warnings?: Array<
              | {
                  details?: string
                  setting: string
                  type: 'unsupported-setting'
                }
              | { details?: string; tool: any; type: 'unsupported-tool' }
              | { message: string; type: 'other' }
            >
          }>
        }
      >
      cloneThread: FunctionReference<
        'action',
        'internal',
        {
          batchSize?: number
          copyUserIdForVectorSearch?: boolean
          excludeToolMessages?: boolean
          insertAtOrder?: number
          limit?: number
          sourceThreadId: string
          statuses?: Array<'pending' | 'success' | 'failed'>
          targetThreadId: string
          upToAndIncludingMessageId?: string
        },
        number
      >
      deleteByIds: FunctionReference<
        'mutation',
        'internal',
        { messageIds: Array<string> },
        Array<string>
      >
      deleteByOrder: FunctionReference<
        'mutation',
        'internal',
        {
          endOrder: number
          endStepOrder?: number
          startOrder: number
          startStepOrder?: number
          threadId: string
        },
        { isDone: boolean; lastOrder?: number; lastStepOrder?: number }
      >
      finalizeMessage: FunctionReference<
        'mutation',
        'internal',
        {
          messageId: string
          result: { status: 'success' } | { error: string; status: 'failed' }
        },
        null
      >
      getMessagesByIds: FunctionReference<
        'query',
        'internal',
        { messageIds: Array<string> },
        Array<null | {
          _creationTime: number
          _id: string
          agentName?: string
          embeddingId?: string
          error?: string
          fileIds?: Array<string>
          finishReason?:
            | 'stop'
            | 'length'
            | 'content-filter'
            | 'tool-calls'
            | 'error'
            | 'other'
            | 'unknown'
          id?: string
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          image: string | ArrayBuffer
                          mediaType?: string
                          mimeType?: string
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'image'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'user'
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          signature?: string
                          text: string
                          type: 'reasoning'
                        }
                      | {
                          data: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'redacted-reasoning'
                        }
                      | {
                          args?: any
                          input: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args: any
                          input?: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args?: any
                          experimental_content?: Array<
                            | { text: string; type: 'text' }
                            | { data: string; mimeType?: string; type: 'image' }
                          >
                          isError?: boolean
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                reason?: string
                                type: 'execution-denied'
                              }
                            | {
                                type: 'content'
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      text: string
                                      type: 'text'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      type: 'media'
                                    }
                                  | {
                                      data: string
                                      filename?: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-id'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-file-id'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'custom'
                                    }
                                >
                              }
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          result?: any
                          toolCallId: string
                          toolName: string
                          type: 'tool-result'
                        }
                      | {
                          id: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'url'
                          title?: string
                          type: 'source'
                          url: string
                        }
                      | {
                          filename?: string
                          id: string
                          mediaType: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'document'
                          title: string
                          type: 'source'
                        }
                      | {
                          approvalId: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          type: 'tool-approval-request'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'assistant'
              }
            | {
                content: Array<
                  | {
                      args?: any
                      experimental_content?: Array<
                        | { text: string; type: 'text' }
                        | { data: string; mimeType?: string; type: 'image' }
                      >
                      isError?: boolean
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            reason?: string
                            type: 'execution-denied'
                          }
                        | {
                            type: 'content'
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  text: string
                                  type: 'text'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  type: 'media'
                                }
                              | {
                                  data: string
                                  filename?: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-id'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-file-id'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'custom'
                                }
                            >
                          }
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      result?: any
                      toolCallId: string
                      toolName: string
                      type: 'tool-result'
                    }
                  | {
                      approvalId: string
                      approved: boolean
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      reason?: string
                      type: 'tool-approval-response'
                    }
                >
                providerOptions?: Record<string, Record<string, any>>
                role: 'tool'
              }
            | {
                content: string
                providerOptions?: Record<string, Record<string, any>>
                role: 'system'
              }
          model?: string
          order: number
          provider?: string
          providerMetadata?: Record<string, Record<string, any>>
          providerOptions?: Record<string, Record<string, any>>
          reasoning?: string
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                signature?: string
                text: string
                type: 'reasoning'
              }
            | { signature?: string; text: string; type: 'text' }
            | { data: string; type: 'redacted' }
          >
          sources?: Array<
            | {
                id: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'url'
                title?: string
                type?: 'source'
                url: string
              }
            | {
                filename?: string
                id: string
                mediaType: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'document'
                title: string
                type: 'source'
              }
          >
          status: 'pending' | 'success' | 'failed'
          stepOrder: number
          text?: string
          threadId: string
          tool: boolean
          usage?: {
            cachedInputTokens?: number
            completionTokens: number
            promptTokens: number
            reasoningTokens?: number
            totalTokens: number
          }
          userId?: string
          warnings?: Array<
            | { details?: string; setting: string; type: 'unsupported-setting' }
            | { details?: string; tool: any; type: 'unsupported-tool' }
            | { message: string; type: 'other' }
          >
        }>
      >
      getMessageSearchFields: FunctionReference<
        'query',
        'internal',
        { messageId: string },
        { embedding?: Array<number>; embeddingModel?: string; text?: string }
      >
      listMessagesByThreadId: FunctionReference<
        'query',
        'internal',
        {
          excludeToolMessages?: boolean
          order: 'asc' | 'desc'
          paginationOpts?: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
          statuses?: Array<'pending' | 'success' | 'failed'>
          threadId: string
          upToAndIncludingMessageId?: string
        },
        {
          continueCursor: string
          isDone: boolean
          page: Array<{
            _creationTime: number
            _id: string
            agentName?: string
            embeddingId?: string
            error?: string
            fileIds?: Array<string>
            finishReason?:
              | 'stop'
              | 'length'
              | 'content-filter'
              | 'tool-calls'
              | 'error'
              | 'other'
              | 'unknown'
            id?: string
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            image: string | ArrayBuffer
                            mediaType?: string
                            mimeType?: string
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'image'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'user'
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            signature?: string
                            text: string
                            type: 'reasoning'
                          }
                        | {
                            data: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'redacted-reasoning'
                          }
                        | {
                            args?: any
                            input: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args: any
                            input?: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args?: any
                            experimental_content?: Array<
                              | { text: string; type: 'text' }
                              | {
                                  data: string
                                  mimeType?: string
                                  type: 'image'
                                }
                            >
                            isError?: boolean
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  reason?: string
                                  type: 'execution-denied'
                                }
                              | {
                                  type: 'content'
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        text: string
                                        type: 'text'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        type: 'media'
                                      }
                                    | {
                                        data: string
                                        filename?: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-id'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-file-id'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'custom'
                                      }
                                  >
                                }
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            result?: any
                            toolCallId: string
                            toolName: string
                            type: 'tool-result'
                          }
                        | {
                            id: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'url'
                            title?: string
                            type: 'source'
                            url: string
                          }
                        | {
                            filename?: string
                            id: string
                            mediaType: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'document'
                            title: string
                            type: 'source'
                          }
                        | {
                            approvalId: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            type: 'tool-approval-request'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'assistant'
                }
              | {
                  content: Array<
                    | {
                        args?: any
                        experimental_content?: Array<
                          | { text: string; type: 'text' }
                          | { data: string; mimeType?: string; type: 'image' }
                        >
                        isError?: boolean
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              reason?: string
                              type: 'execution-denied'
                            }
                          | {
                              type: 'content'
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    text: string
                                    type: 'text'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    type: 'media'
                                  }
                                | {
                                    data: string
                                    filename?: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-id'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-file-id'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'custom'
                                  }
                              >
                            }
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        result?: any
                        toolCallId: string
                        toolName: string
                        type: 'tool-result'
                      }
                    | {
                        approvalId: string
                        approved: boolean
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        reason?: string
                        type: 'tool-approval-response'
                      }
                  >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'tool'
                }
              | {
                  content: string
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'system'
                }
            model?: string
            order: number
            provider?: string
            providerMetadata?: Record<string, Record<string, any>>
            providerOptions?: Record<string, Record<string, any>>
            reasoning?: string
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  signature?: string
                  text: string
                  type: 'reasoning'
                }
              | { signature?: string; text: string; type: 'text' }
              | { data: string; type: 'redacted' }
            >
            sources?: Array<
              | {
                  id: string
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  sourceType: 'url'
                  title?: string
                  type?: 'source'
                  url: string
                }
              | {
                  filename?: string
                  id: string
                  mediaType: string
                  providerMetadata?: Record<string, Record<string, any>>
                  providerOptions?: Record<string, Record<string, any>>
                  sourceType: 'document'
                  title: string
                  type: 'source'
                }
            >
            status: 'pending' | 'success' | 'failed'
            stepOrder: number
            text?: string
            threadId: string
            tool: boolean
            usage?: {
              cachedInputTokens?: number
              completionTokens: number
              promptTokens: number
              reasoningTokens?: number
              totalTokens: number
            }
            userId?: string
            warnings?: Array<
              | {
                  details?: string
                  setting: string
                  type: 'unsupported-setting'
                }
              | { details?: string; tool: any; type: 'unsupported-tool' }
              | { message: string; type: 'other' }
            >
          }>
          pageStatus?: 'SplitRecommended' | 'SplitRequired' | null
          splitCursor?: string | null
        }
      >
      searchMessages: FunctionReference<
        'action',
        'internal',
        {
          embedding?: Array<number>
          embeddingModel?: string
          limit: number
          messageRange?: { after: number; before: number }
          searchAllMessagesForUserId?: string
          targetMessageId?: string
          text?: string
          textSearch?: boolean
          threadId?: string
          vectorScoreThreshold?: number
          vectorSearch?: boolean
        },
        Array<{
          _creationTime: number
          _id: string
          agentName?: string
          embeddingId?: string
          error?: string
          fileIds?: Array<string>
          finishReason?:
            | 'stop'
            | 'length'
            | 'content-filter'
            | 'tool-calls'
            | 'error'
            | 'other'
            | 'unknown'
          id?: string
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          image: string | ArrayBuffer
                          mediaType?: string
                          mimeType?: string
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'image'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'user'
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          signature?: string
                          text: string
                          type: 'reasoning'
                        }
                      | {
                          data: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'redacted-reasoning'
                        }
                      | {
                          args?: any
                          input: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args: any
                          input?: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args?: any
                          experimental_content?: Array<
                            | { text: string; type: 'text' }
                            | { data: string; mimeType?: string; type: 'image' }
                          >
                          isError?: boolean
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                reason?: string
                                type: 'execution-denied'
                              }
                            | {
                                type: 'content'
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      text: string
                                      type: 'text'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      type: 'media'
                                    }
                                  | {
                                      data: string
                                      filename?: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-id'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-file-id'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'custom'
                                    }
                                >
                              }
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          result?: any
                          toolCallId: string
                          toolName: string
                          type: 'tool-result'
                        }
                      | {
                          id: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'url'
                          title?: string
                          type: 'source'
                          url: string
                        }
                      | {
                          filename?: string
                          id: string
                          mediaType: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'document'
                          title: string
                          type: 'source'
                        }
                      | {
                          approvalId: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          type: 'tool-approval-request'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'assistant'
              }
            | {
                content: Array<
                  | {
                      args?: any
                      experimental_content?: Array<
                        | { text: string; type: 'text' }
                        | { data: string; mimeType?: string; type: 'image' }
                      >
                      isError?: boolean
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            reason?: string
                            type: 'execution-denied'
                          }
                        | {
                            type: 'content'
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  text: string
                                  type: 'text'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  type: 'media'
                                }
                              | {
                                  data: string
                                  filename?: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-id'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-file-id'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'custom'
                                }
                            >
                          }
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      result?: any
                      toolCallId: string
                      toolName: string
                      type: 'tool-result'
                    }
                  | {
                      approvalId: string
                      approved: boolean
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      reason?: string
                      type: 'tool-approval-response'
                    }
                >
                providerOptions?: Record<string, Record<string, any>>
                role: 'tool'
              }
            | {
                content: string
                providerOptions?: Record<string, Record<string, any>>
                role: 'system'
              }
          model?: string
          order: number
          provider?: string
          providerMetadata?: Record<string, Record<string, any>>
          providerOptions?: Record<string, Record<string, any>>
          reasoning?: string
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                signature?: string
                text: string
                type: 'reasoning'
              }
            | { signature?: string; text: string; type: 'text' }
            | { data: string; type: 'redacted' }
          >
          sources?: Array<
            | {
                id: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'url'
                title?: string
                type?: 'source'
                url: string
              }
            | {
                filename?: string
                id: string
                mediaType: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'document'
                title: string
                type: 'source'
              }
          >
          status: 'pending' | 'success' | 'failed'
          stepOrder: number
          text?: string
          threadId: string
          tool: boolean
          usage?: {
            cachedInputTokens?: number
            completionTokens: number
            promptTokens: number
            reasoningTokens?: number
            totalTokens: number
          }
          userId?: string
          warnings?: Array<
            | { details?: string; setting: string; type: 'unsupported-setting' }
            | { details?: string; tool: any; type: 'unsupported-tool' }
            | { message: string; type: 'other' }
          >
        }>
      >
      textSearch: FunctionReference<
        'query',
        'internal',
        {
          limit: number
          searchAllMessagesForUserId?: string
          targetMessageId?: string
          text?: string
          threadId?: string
        },
        Array<{
          _creationTime: number
          _id: string
          agentName?: string
          embeddingId?: string
          error?: string
          fileIds?: Array<string>
          finishReason?:
            | 'stop'
            | 'length'
            | 'content-filter'
            | 'tool-calls'
            | 'error'
            | 'other'
            | 'unknown'
          id?: string
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          image: string | ArrayBuffer
                          mediaType?: string
                          mimeType?: string
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'image'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'user'
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          signature?: string
                          text: string
                          type: 'reasoning'
                        }
                      | {
                          data: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'redacted-reasoning'
                        }
                      | {
                          args?: any
                          input: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args: any
                          input?: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args?: any
                          experimental_content?: Array<
                            | { text: string; type: 'text' }
                            | { data: string; mimeType?: string; type: 'image' }
                          >
                          isError?: boolean
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                reason?: string
                                type: 'execution-denied'
                              }
                            | {
                                type: 'content'
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      text: string
                                      type: 'text'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      type: 'media'
                                    }
                                  | {
                                      data: string
                                      filename?: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-id'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-file-id'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'custom'
                                    }
                                >
                              }
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          result?: any
                          toolCallId: string
                          toolName: string
                          type: 'tool-result'
                        }
                      | {
                          id: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'url'
                          title?: string
                          type: 'source'
                          url: string
                        }
                      | {
                          filename?: string
                          id: string
                          mediaType: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'document'
                          title: string
                          type: 'source'
                        }
                      | {
                          approvalId: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          type: 'tool-approval-request'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'assistant'
              }
            | {
                content: Array<
                  | {
                      args?: any
                      experimental_content?: Array<
                        | { text: string; type: 'text' }
                        | { data: string; mimeType?: string; type: 'image' }
                      >
                      isError?: boolean
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            reason?: string
                            type: 'execution-denied'
                          }
                        | {
                            type: 'content'
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  text: string
                                  type: 'text'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  type: 'media'
                                }
                              | {
                                  data: string
                                  filename?: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-id'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-file-id'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'custom'
                                }
                            >
                          }
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      result?: any
                      toolCallId: string
                      toolName: string
                      type: 'tool-result'
                    }
                  | {
                      approvalId: string
                      approved: boolean
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      reason?: string
                      type: 'tool-approval-response'
                    }
                >
                providerOptions?: Record<string, Record<string, any>>
                role: 'tool'
              }
            | {
                content: string
                providerOptions?: Record<string, Record<string, any>>
                role: 'system'
              }
          model?: string
          order: number
          provider?: string
          providerMetadata?: Record<string, Record<string, any>>
          providerOptions?: Record<string, Record<string, any>>
          reasoning?: string
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                signature?: string
                text: string
                type: 'reasoning'
              }
            | { signature?: string; text: string; type: 'text' }
            | { data: string; type: 'redacted' }
          >
          sources?: Array<
            | {
                id: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'url'
                title?: string
                type?: 'source'
                url: string
              }
            | {
                filename?: string
                id: string
                mediaType: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'document'
                title: string
                type: 'source'
              }
          >
          status: 'pending' | 'success' | 'failed'
          stepOrder: number
          text?: string
          threadId: string
          tool: boolean
          usage?: {
            cachedInputTokens?: number
            completionTokens: number
            promptTokens: number
            reasoningTokens?: number
            totalTokens: number
          }
          userId?: string
          warnings?: Array<
            | { details?: string; setting: string; type: 'unsupported-setting' }
            | { details?: string; tool: any; type: 'unsupported-tool' }
            | { message: string; type: 'other' }
          >
        }>
      >
      updateMessage: FunctionReference<
        'mutation',
        'internal',
        {
          messageId: string
          patch: {
            error?: string
            fileIds?: Array<string>
            finishReason?:
              | 'stop'
              | 'length'
              | 'content-filter'
              | 'tool-calls'
              | 'error'
              | 'other'
              | 'unknown'
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            image: string | ArrayBuffer
                            mediaType?: string
                            mimeType?: string
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'image'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'user'
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            text: string
                            type: 'text'
                          }
                        | {
                            data: string | ArrayBuffer
                            filename?: string
                            mediaType?: string
                            mimeType?: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'file'
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            signature?: string
                            text: string
                            type: 'reasoning'
                          }
                        | {
                            data: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'redacted-reasoning'
                          }
                        | {
                            args?: any
                            input: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args: any
                            input?: any
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            toolName: string
                            type: 'tool-call'
                          }
                        | {
                            args?: any
                            experimental_content?: Array<
                              | { text: string; type: 'text' }
                              | {
                                  data: string
                                  mimeType?: string
                                  type: 'image'
                                }
                            >
                            isError?: boolean
                            output?:
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-text'
                                  value: string
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'error-json'
                                  value: any
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  reason?: string
                                  type: 'execution-denied'
                                }
                              | {
                                  type: 'content'
                                  value: Array<
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        text: string
                                        type: 'text'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        type: 'media'
                                      }
                                    | {
                                        data: string
                                        filename?: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'file-id'
                                      }
                                    | {
                                        data: string
                                        mediaType: string
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-data'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-url'
                                        url: string
                                      }
                                    | {
                                        fileId: string | Record<string, string>
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'image-file-id'
                                      }
                                    | {
                                        providerOptions?: Record<
                                          string,
                                          Record<string, any>
                                        >
                                        type: 'custom'
                                      }
                                  >
                                }
                            providerExecuted?: boolean
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            result?: any
                            toolCallId: string
                            toolName: string
                            type: 'tool-result'
                          }
                        | {
                            id: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'url'
                            title?: string
                            type: 'source'
                            url: string
                          }
                        | {
                            filename?: string
                            id: string
                            mediaType: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            sourceType: 'document'
                            title: string
                            type: 'source'
                          }
                        | {
                            approvalId: string
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            toolCallId: string
                            type: 'tool-approval-request'
                          }
                      >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'assistant'
                }
              | {
                  content: Array<
                    | {
                        args?: any
                        experimental_content?: Array<
                          | { text: string; type: 'text' }
                          | { data: string; mimeType?: string; type: 'image' }
                        >
                        isError?: boolean
                        output?:
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-text'
                              value: string
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              type: 'error-json'
                              value: any
                            }
                          | {
                              providerOptions?: Record<
                                string,
                                Record<string, any>
                              >
                              reason?: string
                              type: 'execution-denied'
                            }
                          | {
                              type: 'content'
                              value: Array<
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    text: string
                                    type: 'text'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    type: 'media'
                                  }
                                | {
                                    data: string
                                    filename?: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'file-id'
                                  }
                                | {
                                    data: string
                                    mediaType: string
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-data'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-url'
                                    url: string
                                  }
                                | {
                                    fileId: string | Record<string, string>
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'image-file-id'
                                  }
                                | {
                                    providerOptions?: Record<
                                      string,
                                      Record<string, any>
                                    >
                                    type: 'custom'
                                  }
                              >
                            }
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        result?: any
                        toolCallId: string
                        toolName: string
                        type: 'tool-result'
                      }
                    | {
                        approvalId: string
                        approved: boolean
                        providerExecuted?: boolean
                        providerMetadata?: Record<string, Record<string, any>>
                        providerOptions?: Record<string, Record<string, any>>
                        reason?: string
                        type: 'tool-approval-response'
                      }
                  >
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'tool'
                }
              | {
                  content: string
                  providerOptions?: Record<string, Record<string, any>>
                  role: 'system'
                }
            model?: string
            provider?: string
            providerOptions?: Record<string, Record<string, any>>
            status?: 'pending' | 'success' | 'failed'
          }
        },
        {
          _creationTime: number
          _id: string
          agentName?: string
          embeddingId?: string
          error?: string
          fileIds?: Array<string>
          finishReason?:
            | 'stop'
            | 'length'
            | 'content-filter'
            | 'tool-calls'
            | 'error'
            | 'other'
            | 'unknown'
          id?: string
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          image: string | ArrayBuffer
                          mediaType?: string
                          mimeType?: string
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'image'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'user'
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          text: string
                          type: 'text'
                        }
                      | {
                          data: string | ArrayBuffer
                          filename?: string
                          mediaType?: string
                          mimeType?: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'file'
                        }
                      | {
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          signature?: string
                          text: string
                          type: 'reasoning'
                        }
                      | {
                          data: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          type: 'redacted-reasoning'
                        }
                      | {
                          args?: any
                          input: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args: any
                          input?: any
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          toolName: string
                          type: 'tool-call'
                        }
                      | {
                          args?: any
                          experimental_content?: Array<
                            | { text: string; type: 'text' }
                            | { data: string; mimeType?: string; type: 'image' }
                          >
                          isError?: boolean
                          output?:
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-text'
                                value: string
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                type: 'error-json'
                                value: any
                              }
                            | {
                                providerOptions?: Record<
                                  string,
                                  Record<string, any>
                                >
                                reason?: string
                                type: 'execution-denied'
                              }
                            | {
                                type: 'content'
                                value: Array<
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      text: string
                                      type: 'text'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      type: 'media'
                                    }
                                  | {
                                      data: string
                                      filename?: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'file-id'
                                    }
                                  | {
                                      data: string
                                      mediaType: string
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-data'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-url'
                                      url: string
                                    }
                                  | {
                                      fileId: string | Record<string, string>
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'image-file-id'
                                    }
                                  | {
                                      providerOptions?: Record<
                                        string,
                                        Record<string, any>
                                      >
                                      type: 'custom'
                                    }
                                >
                              }
                          providerExecuted?: boolean
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          result?: any
                          toolCallId: string
                          toolName: string
                          type: 'tool-result'
                        }
                      | {
                          id: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'url'
                          title?: string
                          type: 'source'
                          url: string
                        }
                      | {
                          filename?: string
                          id: string
                          mediaType: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          sourceType: 'document'
                          title: string
                          type: 'source'
                        }
                      | {
                          approvalId: string
                          providerMetadata?: Record<string, Record<string, any>>
                          providerOptions?: Record<string, Record<string, any>>
                          toolCallId: string
                          type: 'tool-approval-request'
                        }
                    >
                providerOptions?: Record<string, Record<string, any>>
                role: 'assistant'
              }
            | {
                content: Array<
                  | {
                      args?: any
                      experimental_content?: Array<
                        | { text: string; type: 'text' }
                        | { data: string; mimeType?: string; type: 'image' }
                      >
                      isError?: boolean
                      output?:
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-text'
                            value: string
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            type: 'error-json'
                            value: any
                          }
                        | {
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >
                            reason?: string
                            type: 'execution-denied'
                          }
                        | {
                            type: 'content'
                            value: Array<
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  text: string
                                  type: 'text'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  type: 'media'
                                }
                              | {
                                  data: string
                                  filename?: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'file-id'
                                }
                              | {
                                  data: string
                                  mediaType: string
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-data'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-url'
                                  url: string
                                }
                              | {
                                  fileId: string | Record<string, string>
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'image-file-id'
                                }
                              | {
                                  providerOptions?: Record<
                                    string,
                                    Record<string, any>
                                  >
                                  type: 'custom'
                                }
                            >
                          }
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      result?: any
                      toolCallId: string
                      toolName: string
                      type: 'tool-result'
                    }
                  | {
                      approvalId: string
                      approved: boolean
                      providerExecuted?: boolean
                      providerMetadata?: Record<string, Record<string, any>>
                      providerOptions?: Record<string, Record<string, any>>
                      reason?: string
                      type: 'tool-approval-response'
                    }
                >
                providerOptions?: Record<string, Record<string, any>>
                role: 'tool'
              }
            | {
                content: string
                providerOptions?: Record<string, Record<string, any>>
                role: 'system'
              }
          model?: string
          order: number
          provider?: string
          providerMetadata?: Record<string, Record<string, any>>
          providerOptions?: Record<string, Record<string, any>>
          reasoning?: string
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                signature?: string
                text: string
                type: 'reasoning'
              }
            | { signature?: string; text: string; type: 'text' }
            | { data: string; type: 'redacted' }
          >
          sources?: Array<
            | {
                id: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'url'
                title?: string
                type?: 'source'
                url: string
              }
            | {
                filename?: string
                id: string
                mediaType: string
                providerMetadata?: Record<string, Record<string, any>>
                providerOptions?: Record<string, Record<string, any>>
                sourceType: 'document'
                title: string
                type: 'source'
              }
          >
          status: 'pending' | 'success' | 'failed'
          stepOrder: number
          text?: string
          threadId: string
          tool: boolean
          usage?: {
            cachedInputTokens?: number
            completionTokens: number
            promptTokens: number
            reasoningTokens?: number
            totalTokens: number
          }
          userId?: string
          warnings?: Array<
            | { details?: string; setting: string; type: 'unsupported-setting' }
            | { details?: string; tool: any; type: 'unsupported-tool' }
            | { message: string; type: 'other' }
          >
        }
      >
    }
    streams: {
      abort: FunctionReference<
        'mutation',
        'internal',
        {
          finalDelta?: {
            end: number
            parts: Array<any>
            start: number
            streamId: string
          }
          reason: string
          streamId: string
        },
        boolean
      >
      abortByOrder: FunctionReference<
        'mutation',
        'internal',
        { order: number; reason: string; threadId: string },
        boolean
      >
      addDelta: FunctionReference<
        'mutation',
        'internal',
        { end: number; parts: Array<any>; start: number; streamId: string },
        boolean
      >
      create: FunctionReference<
        'mutation',
        'internal',
        {
          agentName?: string
          format?: 'UIMessageChunk' | 'TextStreamPart'
          model?: string
          order: number
          provider?: string
          providerOptions?: Record<string, Record<string, any>>
          stepOrder: number
          threadId: string
          userId?: string
        },
        string
      >
      deleteAllStreamsForThreadIdAsync: FunctionReference<
        'mutation',
        'internal',
        { deltaCursor?: string; streamOrder?: number; threadId: string },
        { deltaCursor?: string; isDone: boolean; streamOrder?: number }
      >
      deleteAllStreamsForThreadIdSync: FunctionReference<
        'action',
        'internal',
        { threadId: string },
        null
      >
      deleteStreamAsync: FunctionReference<
        'mutation',
        'internal',
        { cursor?: string; streamId: string },
        null
      >
      deleteStreamSync: FunctionReference<
        'mutation',
        'internal',
        { streamId: string },
        null
      >
      finish: FunctionReference<
        'mutation',
        'internal',
        {
          finalDelta?: {
            end: number
            parts: Array<any>
            start: number
            streamId: string
          }
          streamId: string
        },
        null
      >
      heartbeat: FunctionReference<
        'mutation',
        'internal',
        { streamId: string },
        null
      >
      list: FunctionReference<
        'query',
        'internal',
        {
          startOrder?: number
          statuses?: Array<'streaming' | 'finished' | 'aborted'>
          threadId: string
        },
        Array<{
          agentName?: string
          format?: 'UIMessageChunk' | 'TextStreamPart'
          model?: string
          order: number
          provider?: string
          providerOptions?: Record<string, Record<string, any>>
          status: 'streaming' | 'finished' | 'aborted'
          stepOrder: number
          streamId: string
          userId?: string
        }>
      >
      listDeltas: FunctionReference<
        'query',
        'internal',
        {
          cursors: Array<{ cursor: number; streamId: string }>
          threadId: string
        },
        Array<{
          end: number
          parts: Array<any>
          start: number
          streamId: string
        }>
      >
    }
    threads: {
      createThread: FunctionReference<
        'mutation',
        'internal',
        {
          defaultSystemPrompt?: string
          parentThreadIds?: Array<string>
          summary?: string
          title?: string
          userId?: string
        },
        {
          _creationTime: number
          _id: string
          status: 'active' | 'archived'
          summary?: string
          title?: string
          userId?: string
        }
      >
      deleteAllForThreadIdAsync: FunctionReference<
        'mutation',
        'internal',
        {
          cursor?: string
          deltaCursor?: string
          limit?: number
          messagesDone?: boolean
          streamOrder?: number
          streamsDone?: boolean
          threadId: string
        },
        { isDone: boolean }
      >
      deleteAllForThreadIdSync: FunctionReference<
        'action',
        'internal',
        { limit?: number; threadId: string },
        null
      >
      getThread: FunctionReference<
        'query',
        'internal',
        { threadId: string },
        {
          _creationTime: number
          _id: string
          status: 'active' | 'archived'
          summary?: string
          title?: string
          userId?: string
        } | null
      >
      listThreadsByUserId: FunctionReference<
        'query',
        'internal',
        {
          order?: 'asc' | 'desc'
          paginationOpts?: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
          userId?: string
        },
        {
          continueCursor: string
          isDone: boolean
          page: Array<{
            _creationTime: number
            _id: string
            status: 'active' | 'archived'
            summary?: string
            title?: string
            userId?: string
          }>
          pageStatus?: 'SplitRecommended' | 'SplitRequired' | null
          splitCursor?: string | null
        }
      >
      searchThreadTitles: FunctionReference<
        'query',
        'internal',
        { limit: number; query: string; userId?: string | null },
        Array<{
          _creationTime: number
          _id: string
          status: 'active' | 'archived'
          summary?: string
          title?: string
          userId?: string
        }>
      >
      updateThread: FunctionReference<
        'mutation',
        'internal',
        {
          patch: {
            status?: 'active' | 'archived'
            summary?: string
            title?: string
            userId?: string
          }
          threadId: string
        },
        {
          _creationTime: number
          _id: string
          status: 'active' | 'archived'
          summary?: string
          title?: string
          userId?: string
        }
      >
    }
    users: {
      deleteAllForUserId: FunctionReference<
        'action',
        'internal',
        { userId: string },
        null
      >
      deleteAllForUserIdAsync: FunctionReference<
        'mutation',
        'internal',
        { userId: string },
        boolean
      >
      listUsersWithThreads: FunctionReference<
        'query',
        'internal',
        {
          paginationOpts: {
            cursor: string | null
            endCursor?: string | null
            id?: number
            maximumBytesRead?: number
            maximumRowsRead?: number
            numItems: number
          }
        },
        {
          continueCursor: string
          isDone: boolean
          page: Array<string>
          pageStatus?: 'SplitRecommended' | 'SplitRequired' | null
          splitCursor?: string | null
        }
      >
    }
    vector: {
      index: {
        deleteBatch: FunctionReference<
          'mutation',
          'internal',
          {
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >
          },
          null
        >
        deleteBatchForThread: FunctionReference<
          'mutation',
          'internal',
          {
            cursor?: string
            limit: number
            model: string
            threadId: string
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096
          },
          { continueCursor: string; isDone: boolean }
        >
        insertBatch: FunctionReference<
          'mutation',
          'internal',
          {
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096
            vectors: Array<{
              messageId?: string
              model: string
              table: string
              threadId?: string
              userId?: string
              vector: Array<number>
            }>
          },
          Array<
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
          >
        >
        paginate: FunctionReference<
          'query',
          'internal',
          {
            cursor?: string
            limit: number
            table?: string
            targetModel: string
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096
          },
          {
            continueCursor: string
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >
            isDone: boolean
          }
        >
        updateBatch: FunctionReference<
          'mutation',
          'internal',
          {
            vectors: Array<{
              id:
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
              model: string
              vector: Array<number>
            }>
          },
          null
        >
      }
    }
  }
}
