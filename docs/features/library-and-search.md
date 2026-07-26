# Library and search

The library provides a live view of locally stored knowledge nodes.

## Live data

`App.tsx` subscribes to the node table with `useLiveQuery` and sorts records by
`updatedAt` descending. Dexie reruns the query after writes from capture,
favorite, archive, delete, or import operations.

The resulting node array is passed to the Library as data. Library components do
not query IndexedDB directly, which keeps rendering easy to test and allows a
future store or pagination layer.

## Search

`searchNodes` creates a Fuse.js index over:

- title;
- summary and notes;
- tags and keywords;
- sections;
- resource URLs.

A fuzzy threshold of `0.34` tolerates minor spelling differences without making
results excessively broad. An empty query returns the original array without
creating an index.

For the MVP, indexing happens in memory whenever nodes or the query change. For
10,000+ nodes, keep the function contract but replace its implementation with a
persistent or worker-backed index.

## Filtering

Sections are derived from node data, deduplicated, alphabetized, and prefixed
with `All`. After search ranking, the selected section and archive state filter
the results.

Search happens before section filtering so Fuse controls relevance among the
remaining results.

## Node actions

Each card delegates state changes to repository functions:

- `setFavorite` updates only the favorite flag;
- `archiveNode` hides a node without deleting it;
- `deleteNode` permanently removes the IndexedDB record;
- selecting a card returns the full node to the app shell for editing.

The UI deliberately does not call raw Dexie methods. Repository functions form
the persistence boundary and are the place to add events, audit data, sync
queue writes, or validation later.

## Empty and no-result states

The empty database state directs the user into capture. A non-empty database
with no matching results shows a search-specific message. These states are
separate because they require different recovery actions.
