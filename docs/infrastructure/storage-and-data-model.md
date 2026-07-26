# Storage and data model

## Domain model

`KnowledgeNode` is the durable aggregate stored by the MVP:

| Field | Meaning |
| --- | --- |
| `id` | Stable UUID identity |
| `title` / `slug` | Display name and generated portable identifier |
| `summary` / `notes` | Human-authored knowledge |
| `keywords` / `tags` / `sections` | Search and multi-context organization |
| `resources` | Articles, documentation, videos, repositories, blogs, or notes |
| `relations` | Typed links to other node IDs |
| `archived` / `favorite` | User-managed lifecycle state |
| `createdAt` / `updatedAt` | ISO-8601 timestamps |

`NodeDraft` omits repository-managed fields. This prevents forms from choosing
IDs or timestamps and makes create/edit ownership explicit.

Relationships are embedded in nodes for the MVP. At larger graph scale, move
them to a dedicated edge table with compound indexes while retaining a domain
mapping layer.

## IndexedDB and Dexie

The database is named `threadmark`. Version 1 defines one `nodes` table:

```text
id, title, slug, archived, favorite, createdAt, updatedAt, *tags, *sections
```

`id` is the primary key. Asterisks mark multi-entry indexes for array fields.
The remaining fields are secondary indexes available for future query
optimization.

Dexie is used because it provides:

- schema versioning;
- typed tables;
- transactions and bulk operations;
- reactive queries through `dexie-react-hooks`;
- clearer error behavior than raw IndexedDB callbacks.

## Persistence boundary

`database.ts` owns schema initialization only.

`node-repository.ts` owns node writes and lifecycle commands. Features should use
this API rather than importing the database for mutations.

`graph-transfer.ts` owns the serialized backup format and transactional imports.

The app shell currently reads through a Dexie live query. If read complexity
grows, introduce query functions or a read repository without changing write
callers.

## Slugs

Slug generation lowercases the title, converts non-alphanumeric runs to hyphens,
and removes leading/trailing hyphens. Slugs are readable but are not identities
and are not guaranteed unique. UUIDs remain the authoritative keys.

## Schema changes

Never edit an already released Dexie version in place. Add a new version:

```ts
this.version(2)
  .stores({ nodes: "...", syncQueue: "++id,status,createdAt" })
  .upgrade(async (transaction) => {
    // Migrate existing records.
  });
```

Every schema migration should include tests using `fake-indexeddb`.
