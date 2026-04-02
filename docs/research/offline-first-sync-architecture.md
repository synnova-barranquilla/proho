# Offline-First Sync Architecture Research

**Date:** April 2026
**Purpose:** Evaluate offline-first sync patterns for a web/tablet app built on Convex

---

## Table of Contents

1. [IndexedDB + Service Worker Patterns](#1-indexeddb--service-worker-patterns)
2. [CRDT-Based Sync](#2-crdt-based-sync)
3. [PowerSync](#3-powersync)
4. [Custom Sync Queue Patterns](#4-custom-sync-queue-patterns)
5. [PWA + Background Sync API](#5-pwa--background-sync-api)
6. [TanStack Query Offline](#6-tanstack-query-offline)
7. [Convex-Specific Solutions](#7-convex-specific-solutions)
8. [Recommendations](#8-recommendations)

---

## 1. IndexedDB + Service Worker Patterns

### Core Architecture

The standard offline-first pattern for web apps follows this flow:

1. **All writes go to IndexedDB first** -- guarantees instant UI feedback regardless of network state
2. **All reads come from local store** -- the UI always reads from IndexedDB; the network is used for sync, not reads
3. **Service worker intercepts network requests** -- serves cached responses (cache-first) for instant rendering
4. **Background sync pushes queued writes** -- when connectivity returns, queued mutations replay to the server

### Storage Technologies

| Technology                 | Best For                             | Key Advantage                                       |
| -------------------------- | ------------------------------------ | --------------------------------------------------- |
| **IndexedDB**              | Structured app data, transactions    | ACID-compliant, supports indexing and range queries |
| **SQLite (via WASM/OPFS)** | Relational queries, complex datasets | Full SQL, handles millions of rows in-browser       |
| **Cache API**              | Static assets, HTTP responses        | Seamless with service workers                       |
| **LocalStorage**           | Trivial config only                  | Simple but limited to ~5-10 MB, blocks main thread  |

IndexedDB remains the right tool for serious application data beyond simple key-value storage. SQLite-in-the-browser (via WebAssembly + Origin Private File System) is emerging as a strong alternative for apps that need relational queries.

### Library Comparison

#### Dexie.js

- **What:** Minimalistic IndexedDB wrapper (~29k gzipped)
- **Strengths:** Clean Promise-based API, batches transactions for performance, excellent TypeScript support, lightweight
- **Weaknesses:** No built-in sync, no complex MongoDB-like queries, no reactive subscriptions out of the box
- **Best for:** Projects that want direct IndexedDB access with a better DX, and will build their own sync layer
- **Dexie Cloud:** Paid add-on that adds sync, but ties you to their backend

#### RxDB

- **What:** Local-first reactive NoSQL database for JavaScript
- **Strengths:** Reactive queries (subscribe to changes), runs on top of IndexedDB/OPFS/SQLite/LokiJS, built-in replication plugins for CouchDB/GraphQL/REST/WebSocket/custom, multi-tab support, encryption plugin
- **Weaknesses:** Heavier than Dexie, premium features require license, learning curve
- **Best for:** Apps needing production sync to any backend with reactive UI updates
- **Sync:** Has a replication protocol that can work with custom backends via its GraphQL or custom replication plugin

#### WatermelonDB

- **What:** High-performance reactive database for React/React Native
- **Strengths:** Lazy-loading architecture handles 10k+ records without lag, built for React Native with SQLite backend, good offline sync primitives
- **Weaknesses:** Primarily React Native focused, web support is secondary, sync requires custom implementation
- **Best for:** React Native apps with large local datasets

#### ElectricSQL

- **What:** Postgres-to-local sync engine
- **Strengths:** Syncs directly from Postgres using the wire protocol, partial sync support
- **Weaknesses:** Currently in rewrite (Electric-Next), write path not yet fully implemented, requires Postgres as source, client-side reactivity incomplete
- **Best for:** Postgres-native apps wanting automatic sync; not suitable as a layer on top of Convex

### Key Takeaway

For a Convex-based app, **Dexie.js** or **RxDB** are the most relevant. Dexie is lighter if you want to build a custom sync layer; RxDB provides more batteries-included sync infrastructure. WatermelonDB and ElectricSQL are less relevant for this use case.

---

## 2. CRDT-Based Sync

### Overview

CRDTs (Conflict-free Replicated Data Types) allow multiple replicas to be modified independently and always converge to the same state without coordination. They are the gold standard for collaborative + offline editing.

### Yjs

- ~900k weekly npm downloads; the most popular CRDT engine
- Supports shared types: Text, Array, Map, XML
- **Storage:** `y-indexeddb` provider persists to IndexedDB for offline
- **Sync:** Protocol-agnostic; providers exist for WebSocket (`y-websocket`), WebRTC (`y-webrtc`), and custom transports
- **Editor integrations:** ProseMirror, TipTap, CodeMirror, Quill, Monaco
- **Custom backend:** You can write a custom sync provider that pushes Yjs updates to Convex and pulls them back
- **Size:** Relatively compact CRDT encoding

### Automerge

- JSON-like data model (maps, lists, text, counters)
- Built in Rust with JS bindings via WebAssembly
- **Storage:** `IndexedDBStorageAdapter` for offline persistence
- **Sync:** `automerge-repo` handles synchronization between peers; supports custom network adapters
- **Key advantage:** More general-purpose than Yjs (not just text); handles arbitrary JSON document structures
- **Convex integration exists:** See Section 7 below

### Automerge + Convex (Official Pattern)

This is a documented, production-viable pattern from the Convex team:

**Storage model:**

- Automerge changes stored in a Convex table with fields: document ID, change type (incremental/snapshot), content hash, binary data
- Snapshots include full edit history; incremental changes track deltas since last sync

**Sync flow:**

1. Client loads from IndexedDB, subscribes to server changes via paginated Convex queries
2. Local edits produce deltas via `getChanges()` (diff since last sync point)
3. Deltas upload to server as idempotent mutations with deduplication (content hash)
4. Server broadcasts to other clients via Convex subscriptions; they apply via `loadIncremental()`
5. Periodic snapshots compact history for new clients

**Key properties:**

- Changes are inherently idempotent (safe to reapply)
- Single-flight mutations prevent concurrent redundant submissions
- Use stable UUIDs for objects, not array indices
- Server can validate changes in Node actions by loading full documents

**Selective use:** The architecture explicitly avoids forcing all data into CRDTs. Use CRDTs for collaborative/offline-sensitive data; keep authorization and critical state in normal Convex mutations/transactions.

### Emerging: SyncForge

- Next-gen CRDT library claiming faster benchmarks than Yjs/Automerge
- Early stage; not yet production-proven

### Key Takeaway

**Automerge + Convex is the most mature path** for CRDT-based offline sync with Convex, with official documentation and patterns. Yjs is viable if you need rich text collaboration specifically (better editor integrations). For general offline data sync (not collaborative editing), CRDTs may be overengineered -- a simpler sync queue might suffice.

---

## 3. PowerSync

### Architecture

PowerSync is a two-component system:

1. **PowerSync Service** (cloud or self-hosted): Connects to your source database, continuously replicates data by tracking changes, streams updates to clients via "Sync Streams" (dynamic partitioning -- each user gets only their data)
2. **Client SDKs** (Web/React Native/Flutter/etc.): Manage client-side SQLite persistence, reactivity, and write queuing

### How Writes Work

- Writes apply to local SQLite instantly
- Queued for upload to your backend API
- You implement a `BackendConnector` with two methods:
  - `fetchCredentials()` -- returns a JWT for auth with PowerSync Service
  - `uploadData()` -- called by SDK to push local writes to your backend API

You have full control over write logic, conflict resolution, and how mutations reach your database.

### Supported Backends

PowerSync requires one of these as the **source database** (for the downstream read path):

- PostgreSQL
- MongoDB
- MySQL
- SQL Server (alpha)

### Can It Sit in Front of Convex?

**No, not directly.** PowerSync's downstream sync (server-to-client) works by connecting to a supported database's change stream (Postgres logical replication, MongoDB change streams, etc.). Convex does not expose a Postgres/MongoDB-compatible change stream, so PowerSync cannot read from Convex.

**Theoretical workaround:** You could mirror Convex data into a Postgres database and have PowerSync read from that, but this adds significant complexity and latency, defeating the purpose.

**Upstream (client-to-server) could work:** The `uploadData()` connector could call Convex mutations. But without the downstream sync working, this is only half a solution.

### Verdict

PowerSync is an excellent product but is architecturally incompatible with Convex as the primary backend. It requires a traditional database (Postgres/MongoDB/MySQL/SQL Server) as its data source.

---

## 4. Custom Sync Queue Patterns

### Standard Architecture

```
[UI] --> [Local Store (IndexedDB)] --> [Sync Queue (IndexedDB)] --> [Sync Worker] --> [Server API]
                                                                         ^
                                                                         |
                                                                  [Server pushes changes back]
```

### The Outbox Pattern

Each local write produces a queue entry:

```json
{
  "id": "uuid-v4",
  "operation": "update",
  "table": "tasks",
  "documentId": "task-42",
  "fields": { "status": "done" },
  "version": 3,
  "timestamp": 1676790000000,
  "idempotencyKey": "uuid-v4",
  "status": "pending"
}
```

The sync worker drains the queue:

1. Read pending operations in order
2. POST to server with idempotency key
3. On success: mark as synced, remove from queue
4. On failure: retry with exponential backoff
5. On conflict (409): fetch server state, resolve, retry

### Conflict Resolution Strategies

| Strategy                   | How It Works                                                  | When to Use                              |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **Last-Write-Wins (LWW)**  | Timestamp or version counter; later write overwrites          | Low-conflict data, logs, analytics       |
| **Server-Wins**            | Server state always takes precedence                          | When server is authoritative             |
| **Client-Wins**            | Client state always takes precedence                          | Rare; user-owned data only               |
| **Field-Level Merge**      | Merge at field level; only conflicting fields need resolution | Most CRUD apps -- best default           |
| **CRDTs**                  | Mathematically guaranteed convergence                         | Collaborative editing, counters          |
| **Manual/User Resolution** | Surface conflict to user                                      | Critical data: medical, financial, legal |
| **Operation Logs**         | Server maintains ordered operation log; clients fetch diffs   | High-consistency domains                 |

### Ordering and Dependencies

Operation ordering is critical. Example problem: creating a todo item and immediately editing it requires the create to sync before the edit. Strategies:

- **Sequential processing:** Process queue items one-at-a-time in order
- **Dependency tracking:** Tag operations with dependencies; process in dependency order
- **Batch with transaction semantics:** Group related operations into a single server call

### Idempotency

- Assign a stable client-generated UUID to every mutation
- Send as `Idempotency-Key` header or include in mutation payload
- Server checks: if this key was already processed, return the cached response
- This makes retries safe after network failures

### Versioning / Optimistic Concurrency

- Every document has a version number or ETag
- Client sends version with mutating requests
- Server rejects with 409 Conflict if version mismatch
- Client fetches current state and re-resolves

### Key Takeaway

A custom sync queue is the most flexible approach and maps well to Convex's existing mutation model. Convex mutations already support idempotent delivery and queuing when offline. The main work is: (1) persisting the queue to IndexedDB so it survives browser close, (2) implementing conflict resolution appropriate to your domain, and (3) handling the read side (caching Convex query results locally for offline reads).

---

## 5. PWA + Background Sync API

### How It Works

1. User performs action while offline
2. App stores the mutation in IndexedDB
3. App registers a Background Sync event via `navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-mutations'))`
4. When connectivity returns, the browser fires a `sync` event in the service worker
5. Service worker reads the queue from IndexedDB and replays mutations to the server

### Implementation Pattern

```javascript
// In your app code (register sync)
async function queueMutation(mutation) {
  await db.syncQueue.add(mutation)
  const reg = await navigator.serviceWorker.ready
  await reg.sync.register('sync-mutations')
}

// In service worker (handle sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(drainSyncQueue())
  }
})

async function drainSyncQueue() {
  const pending = await db.syncQueue.where('status').equals('pending').toArray()
  for (const mutation of pending) {
    await fetch('/api/mutate', {
      method: 'POST',
      body: JSON.stringify(mutation),
    })
    await db.syncQueue.delete(mutation.id)
  }
}
```

### Browser Support (Critical Limitation)

| Browser           | One-off Background Sync | Periodic Background Sync |
| ----------------- | ----------------------- | ------------------------ |
| Chrome/Edge/Opera | Yes                     | Yes (limited)            |
| Firefox           | No (disabled)           | No                       |
| Safari            | No                      | No                       |

**This is a major limitation.** Background Sync only works in Chromium browsers. For Firefox and Safari, you must implement a fallback: replay the queue on app startup, on `navigator.onLine` events, or on a timer.

### Workbox Integration

Google's Workbox library provides a `BackgroundSyncPlugin` that automates queue management:

- Automatically queues failed requests
- Replays them when sync fires
- Configurable retry with backoff
- Falls back gracefully

### Key Takeaway

Background Sync API is useful as an enhancement but cannot be relied upon as the primary sync mechanism due to Safari/Firefox gaps. Always implement an app-level fallback. For a tablet app that might run on iPad (Safari), this is especially important.

---

## 6. TanStack Query Offline

### Built-in Offline Mutation Support

TanStack Query (v5) has native support for offline mutations:

- **`networkMode: 'offlineFirst'`** -- mutations execute immediately even offline; if the network request fails, it's paused and retried when online
- **`persistQueryClient`** plugin -- persists query cache to localStorage/IndexedDB
- **`resumePausedMutations()`** -- replays paused mutations after hydration from storage

### How to Set Up

1. Configure a persister (e.g., `createSyncStoragePersister` for localStorage or `createAsyncStoragePersister` for IndexedDB)
2. Wrap app in `PersistQueryClientProvider`
3. Set `defaultOptions.mutations.mutationFn` at the QueryClient level (required for resumption after page reload)
4. On restore, call `resumePausedMutations()`

### Important Limitations

1. **Functions cannot be serialized** -- only mutation state (variables, status) persists; the `mutationFn` must be re-provided via defaults
2. **Component must be mounted** -- if the component that triggered the mutation isn't mounted when resuming, errors can occur
3. **No conflict resolution** -- TanStack Query is a caching/fetching layer, not a sync engine; conflict resolution must be handled in your API layer
4. **No fine-grained merge** -- mutations are replayed as-is; if server state changed, you get whatever your API returns (likely last-write-wins)
5. **Not designed for complex offline scenarios** -- works well for "retry failed requests" but not for true offline-first with local reads

### Relevance to Convex

TanStack Query is typically used with REST/GraphQL APIs. Convex has its own reactive query system (`useQuery`) that already provides:

- Real-time subscriptions
- Automatic re-fetching
- Optimistic updates
- Mutation queuing when offline

Adding TanStack Query on top of Convex would be redundant for most use cases. The Convex client already handles the online case well; the gap is offline persistence of cached data.

### Key Takeaway

TanStack Query's offline support is a lightweight retry mechanism, not a full offline-first solution. It is not the right tool for this use case, especially with Convex already providing a reactive data layer.

---

## 7. Convex-Specific Solutions

### What Convex Already Provides

- **Mutation queuing:** When offline, mutations queue and deliver when reconnected with idempotent, exactly-once semantics
- **Reactive queries:** `useQuery` provides real-time subscriptions
- **Optimistic updates:** Supported via `optimisticUpdate` on mutations

### What Convex Lacks for Offline-First

- **No persistent local cache:** Query results are in-memory only; closing the browser loses all cached data
- **No offline reads:** If you open the app offline, you see nothing until the connection is established
- **No local-first writes that survive browser close:** The mutation queue is in-memory

### Replicate (trestleinc/replicate) -- Most Promising

A dedicated local-first sync engine built specifically for Convex (updated January 2026):

**Architecture:**

- Keeps a full data copy in client-side SQLite (OPFS on web, op-sqlite on React Native)
- Syncs through Convex using Yjs CRDTs
- Dual-storage model on both client and server:
  1. Materialized JSON in SQLite -- fast queries, offline reads
  2. Yjs CRDT binary in SQLite -- conflict-free merging

**Data flow:**

- **Writes:** Apply instantly to local SQLite, debounced/batched, sent to Convex via `replicate` mutation. Server rejections trigger local rollback.
- **Reads:** Query directly against local SQLite (works offline)
- **Sync:** Convex pushes CRDT deltas via subscriptions; client applies to local SQLite

**Exported Convex functions:**

- `material` (query) -- paginated materialized documents
- `delta` (query) -- real-time CRDT stream
- `replicate` (mutation) -- insert/update/delete
- `presence` (mutation) -- session management
- `session` (query) -- connected sessions

**Rich text:** Supports collaborative editing via ProseMirror-compatible prose fields with CRDT-backed conflict resolution.

### Automerge + Convex (Official Pattern)

See Section 2 above. This is a selective approach: use Automerge CRDTs for specific collaborative/offline documents while keeping the rest of the app on standard Convex queries/mutations.

### convex-offline (musicmindmachine/convex-offline)

A community library for local-first with Convex. Less documented than Replicate but worth evaluating.

---

## 8. Recommendations

### For This Project (Convex Backend, Web/Tablet App)

#### Option A: Replicate (Highest Integration, Least Custom Work)

- Purpose-built for Convex + offline
- Handles reads, writes, sync, conflict resolution via CRDTs
- Supports web (OPFS/SQLite) and React Native
- **Risk:** Relatively new (January 2026), community-maintained, may have rough edges
- **Evaluate:** Check maturity, documentation quality, and whether it supports your data model

#### Option B: Custom Sync Queue + IndexedDB Cache (Most Control)

Build a lightweight layer that:

1. Caches Convex query results in IndexedDB (using Dexie.js for ergonomics)
2. On app load, render from IndexedDB immediately, then subscribe to Convex for live updates
3. Writes go to Convex mutations normally (they already queue when offline)
4. Persist the Convex mutation queue to IndexedDB so it survives browser close
5. Use Background Sync API (with fallback) to trigger queue drain

**Conflict resolution:** Leverage Convex's server-side transaction model -- mutations that conflict will be retried by Convex. For field-level conflicts, implement merge logic in Convex mutations.

**This is the pragmatic middle ground** -- minimal new dependencies, works with Convex's existing model.

#### Option C: Automerge + Convex (For Collaborative Features)

If the app has collaborative editing needs (e.g., shared documents, notes, or forms that multiple users edit):

- Use Automerge for those specific data types
- Follow the documented Convex + Automerge pattern
- Keep non-collaborative data on standard Convex

#### Not Recommended for This Project

- **PowerSync:** Incompatible with Convex (requires Postgres/MongoDB/MySQL as source)
- **ElectricSQL:** Requires Postgres, incomplete write path
- **TanStack Query:** Redundant with Convex's reactive layer
- **WatermelonDB:** React Native focused, no Convex integration
- **Full CRDT for everything:** Overengineered unless the app is primarily collaborative editing

### Suggested Architecture (Option B Detail)

```
[React UI]
    |
    v
[Convex useQuery + useMutation] <-- standard Convex hooks
    |                    |
    v                    v
[IndexedDB Cache]    [IndexedDB Mutation Queue]
(Dexie.js)           (persists pending mutations)
    |                    |
    v                    v
[Service Worker]     [Sync Worker]
(cache-first         (drains queue on reconnect,
 for static          Background Sync + fallback)
 assets)
```

**Key implementation pieces:**

1. `useOfflineQuery(queryName, args)` -- wrapper that reads from IndexedDB first, subscribes to Convex, updates IndexedDB on new data
2. `useOfflineMutation(mutationName)` -- wrapper that persists mutation to IndexedDB queue, calls Convex mutation (which handles its own retry), cleans up queue on confirmation
3. Service worker for static asset caching (Workbox)
4. Background Sync registration with online/visibility fallback for Safari/Firefox
5. Sync status indicator in UI

---

## Sources

### IndexedDB + Service Workers

- [Offline-first frontend apps in 2025 - LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Build an Offline-First PWA with Next.js & IndexedDB](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb)
- [Building Local-First Apps with Vue and Dexie.js](https://alexop.dev/posts/building-local-first-apps-vue-dexie/)
- [Advanced PWA Playbook: Offline, Push & Background Sync](https://rishikc.com/articles/advanced-pwa-features-offline-push-background-sync/)
- [Offline sync & conflict resolution patterns (Feb 2026)](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/)

### CRDT Libraries

- [Best CRDT Libraries 2025 - Velt](https://velt.dev/blog/best-crdt-libraries-real-time-data-sync)
- [Going local-first with Automerge and Convex](https://stack.convex.dev/automerge-and-convex)
- [Building Offline-First Collaborative Editors with CRDTs and IndexedDB](https://dev.to/hexshift/building-offline-first-collaborative-editors-with-crdts-and-indexeddb-no-backend-needed-4p7l)
- [Yjs Documentation](https://docs.yjs.dev)
- [Automerge](https://automerge.org/)
- [Why Cinapse Moved Away From CRDTs For Sync](https://www.powersync.com/blog/why-cinapse-moved-away-from-crdts-for-sync)

### PowerSync

- [PowerSync Homepage](https://www.powersync.com/)
- [Integrate with your Backend - PowerSync Docs](https://docs.powersync.com/installation/client-side-setup/integrating-with-your-backend)
- [MongoDB Atlas + PowerSync](https://www.mongodb.com/company/blog/innovation/mongodb-atlas-power-sync-future-offline-first-enterprise-apps)

### TanStack Query

- [TanStack Query Mutations Docs](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Supporting Offline Mode in TanStack Query](https://lucas-barake.github.io/persisting-tantsack-query-data-locally/)
- [TanStack Query Offline Example](https://tanstack.com/query/v4/docs/framework/react/examples/offline)

### PWA Background Sync

- [MDN: Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [How to Implement Background Sync in React PWAs](https://oneuptime.com/blog/post/2026-01-15-background-sync-react-pwa/view)
- [Offline-First PWA Architecture](https://beefed.ai/en/offline-first-pwa-architecture)

### Convex-Specific

- [Convex Sync Platform](https://www.convex.dev/sync)
- [Replicate: local-first with Convex](https://github.com/trestleinc/replicate)
- [convex-offline](https://github.com/musicmindmachine/convex-offline)
- [Convex Object Sync Engine](https://stack.convex.dev/object-sync-engine)

### Custom Sync Patterns

- [Building an offline-first app with build-from-scratch Sync Engine](https://dev.to/daliskafroyan/builing-an-offline-first-app-with-build-from-scratch-sync-engine-4a5e)
- [Offline-First: Outbox, Idempotency & Conflict Resolution](https://www.educba.com/offline-first/)
- [RxDB Alternatives Comparison](https://rxdb.info/alternatives.html)
- [TinyBase vs WatermelonDB vs RxDB](https://www.pkgpulse.com/blog/tinybase-vs-watermelondb-vs-rxdb-offline-first-2026)
