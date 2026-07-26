# Capture and editing

The capture feature turns browser context into a validated `KnowledgeNode`.

## Entry paths

### Toolbar popup

1. The application calls `getCurrentPage()`.
2. The browser adapter queries the active tab.
3. Its title and URL prefill the capture form.
4. Nothing is persisted until the user selects **Add to graph**.

### Context menu

1. The background service worker receives a context-menu click.
2. It records the tab title, URL or clicked link, and selected text.
3. The payload is stored temporarily as `pendingCapture`.
4. The popup reads and deletes that payload.
5. Selected text prefills the summary.

### Development preview

Normal Vite pages do not expose extension APIs. The browser adapter returns a
deterministic example capture when `chrome.tabs` is unavailable, allowing UI
development without loading an unpacked extension.

## Draft construction

`createInitialDraft` in `CaptureForm.tsx` supports three states:

- existing node: strip generated fields and edit the durable content;
- page capture: create a draft with one article resource;
- blank state: use `EMPTY_NODE_DRAFT`.

Generated fields such as ID, slug, timestamps, favorite, and archive status are
owned by the repository rather than the form.

## Form behavior

The form edits:

- title;
- summary;
- sections;
- tags;
- keywords;
- notes;
- the automatically captured primary resource.

Comma-separated values are normalized by trimming whitespace, removing empty
values, and deduplicating entries. Sections and tags use a chip input:

- comma or Enter commits the current value as a chip;
- Backspace removes the final chip when the text field is empty;
- each chip has an explicit remove control;
- blur commits any unfinished value.

Keywords retain the compact comma-separated input.

## Validation

Zod validates the submitted draft. The MVP requires a non-empty title. The
schema lives under `features/capture/model` because it currently represents
capture-form policy. If the same invariant must be enforced by imports, sync,
and other write paths, promote it into the domain layer and apply it at every
repository boundary.

## Persistence

On submit, `saveNode` first resolves an upsert target:

1. an explicitly edited node ID;
2. a normalized resource URL match;
3. a case-insensitive, whitespace-normalized title match.

URL normalization removes fragments, common tracking parameters, query ordering
differences, and trailing path slashes. When a target exists, non-empty scalar
values replace previous values, blank summary/notes preserve previous content,
and array/resource/relation fields are unioned.

The repository then:

1. creates or preserves the UUID;
2. regenerates the slug from the current title;
3. preserves favorite, archive, and creation state while editing;
4. updates the modification timestamp;
5. performs an IndexedDB `put`, which creates or replaces by ID;
6. queues a GitHub upsert in the same database transaction.

After the promise resolves, the app navigates to the library. Dexie's live query
updates the visible list automatically. The background worker is notified and
attempts the queued sync when GitHub sync is enabled.

## Current limitations

- Only the captured resource is editable through the current form.
- Relationship editing is represented in the model but not exposed in the UI.
- Existing duplicate records created by older versions are not automatically
  collapsed; the upsert rules prevent new duplicates, while older extras can be
  removed from Library.
- Markdown preview is not rendered; notes are stored as Markdown-compatible
  source text.
