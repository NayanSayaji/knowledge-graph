# Import and export

Threadmark uses JSON transfer files as the MVP portability and backup mechanism.
IndexedDB remains the primary local database.

## Export format

```json
{
  "version": 1,
  "exportedAt": "2026-07-26T08:30:00.000Z",
  "nodes": []
}
```

- `version` identifies the transfer schema.
- `exportedAt` records when the backup was produced.
- `nodes` contains complete domain records, including relationships and
  resources.

The Settings feature creates a JSON Blob, generates a temporary object URL,
clicks a programmatic download link, and immediately revokes the object URL.

## Import behavior

1. The user selects a `.json` file.
2. The Settings feature reads it as text.
3. `importGraph` parses the JSON and checks for a top-level node array.
4. `bulkPut` writes all records in one Dexie transaction.
5. Existing records with matching IDs are updated; other local records remain.
6. The live node query refreshes the UI.

The transaction makes the database write atomic: if the bulk operation fails,
Dexie rolls back the transaction.

## Merge semantics

Import is currently an **upsert merge**, not a full restore:

- matching IDs are replaced by imported values;
- new IDs are inserted;
- local nodes absent from the file are preserved.

This is safer than silently deleting local information. A future full-restore
operation should be a separate, clearly destructive command with confirmation.

## Validation and migrations

The MVP guard verifies the transfer container but does not validate every nested
node field. Before supporting untrusted or long-lived exports:

1. define a full versioned Zod schema;
2. reject unsupported future versions;
3. add migration functions between schema versions;
4. report per-record errors without exposing partial writes.
