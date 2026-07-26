# KnowlegeGraph

KnowlegeGraph is an offline-first browser extension that turns useful pages,
selected text, and personal notes into a searchable developer knowledge graph.
Knowledge is stored locally in IndexedDB and can be backed up to GitHub as
portable Markdown.

Detailed engineering documentation starts at
[docs/README.md](./docs/README.md).

## Features

- Capture the current page title and URL automatically
- Capture selected text from the browser context menu
- Create, edit, archive, favorite, and delete knowledge nodes
- Organize nodes with sections, tags, keywords, summaries, and Markdown notes
- Add sections and tags as removable chips using comma or Enter
- Upsert matching titles and normalized URLs without losing existing metadata
- Fuzzy search titles, notes, metadata, sections, and URLs
- Work offline with IndexedDB persistence
- Import and export the complete graph as JSON
- Create an initialized GitHub repository automatically
- Resolve repository-name collisions with `_1`, `_2`, and later suffixes
- Sync Markdown, `graph.json`, and a generated index to GitHub
- Queue changes offline and retry them from the background runtime
- Restore GitHub-backed knowledge into an empty IndexedDB after reconnecting

## Install in Chrome

### 1. Build the Chrome extension

```bash
npm install
npm run build:chrome
```

This creates the loadable extension in `dist/`.

### 2. Load it in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** using the switch in the upper-right corner.
3. Select **Load unpacked**.
4. Choose this project's `dist` directory.
5. Pin **KnowlegeGraph** from Chrome's Extensions menu for quick access.

Chrome loads the local build immediately. No Chrome Web Store account is needed
for development installation.

### 3. Update an installed development build

After changing the code:

```bash
npm run build:chrome
```

Return to `chrome://extensions` and select the reload icon on the KnowlegeGraph
card. Local IndexedDB data is preserved when reloading the extension.

## Use KnowlegeGraph in Chrome

### Capture the current page

1. Open an article, documentation page, video, or repository.
2. Select the KnowlegeGraph toolbar icon.
3. Review the detected page title and URL.
4. Add a summary, sections, tags, keywords, or Markdown notes.
5. Select **Add to graph**.

The node is saved locally before any network synchronization is attempted.
Typing a comma or pressing Enter in Sections or Tags converts the value into a
removable chip.

When a URL already exists, KnowlegeGraph updates that node instead of creating a
duplicate. A case-insensitive title match is used when there is no matching URL.
Non-empty title, summary, and notes values update the existing node; blank
summary or notes preserve prior content. Sections, tags, keywords, resources,
and relationships are merged without case-insensitive duplicates.

### Capture selected text

1. Highlight useful text on a page.
2. Right-click the selection.
3. Select **Save to KnowlegeGraph**.
4. Open or review the popup—the selected text is prefilled as the summary.
5. Complete the node and save it.

### Search and manage knowledge

Open **Library** to:

- search titles, tags, keywords, notes, sections, and resource URLs;
- filter by section;
- select a card to edit it;
- favorite, archive, or delete a node from its action menu.

### Import or export a backup

Open **Settings**:

- **Export JSON** downloads the complete local graph;
- **Import JSON** merges nodes by their stable IDs and queues a GitHub refresh.

Import does not delete local nodes that are absent from the selected file.

## Configure GitHub backup

1. Open **Settings → GitHub backup**.
2. Select **Create token**. GitHub opens with the required permissions
   prefilled.
3. Select the correct resource owner and **All repositories**.
4. Confirm:
   - **Administration: Read and write**
   - **Contents: Read and write**
5. Generate the token and paste it into KnowlegeGraph.
6. Keep or edit the default repository name `knowlege-base`.
7. Keep **private repository** selected unless the notes should be public.
8. Select **Create repository & sync**.

If `knowlege-base` already has KnowlegeGraph's generated-repository description,
the extension reuses it. If the description is different, it tries
`knowlege-base_1`, `knowlege-base_2`, and so on. New repositories are
initialized, connected, and populated during the same setup flow.

The generated dashboard is written to the repository's root `README.md`, so it
is visible immediately when the repository opens. It contains status badges,
favorites, collapsible section tables, and recently updated topics. The root
README is managed by KnowlegeGraph and replaced on every successful sync.

The token remains in extension-local storage. It is never included in JSON
exports, Markdown files, or GitHub commits. See the detailed
[GitHub sync guide](./docs/features/github-sync.md).

When an existing KnowlegeGraph repository is reused or connected, its graph is
restored into IndexedDB before the next push. If local IndexedDB is empty but
saved GitHub settings remain, the extension also attempts this restoration when
the popup starts.

## Install temporarily in Firefox

Firefox uses a different Manifest V3 background format, so use the dedicated
Firefox build:

```bash
npm install
npm run build:firefox
```

This creates `dist-firefox/`.

Then:

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose `dist-firefox/manifest.json`.
5. Pin KnowlegeGraph from Firefox's Extensions menu if desired.

Temporary add-ons remain installed until Firefox restarts. During development,
return to `about:debugging#/runtime/this-firefox` and select **Reload** after
running `npm run build:firefox` again.

For permanent distribution, the extension must be packaged and signed through
Mozilla Add-ons. The Firefox manifest already includes a stable Gecko add-on ID.

## Development

```bash
npm run dev            # Popup UI development server
npm run typecheck      # TypeScript validation
npm test               # Unit and infrastructure tests
npm run build:chrome   # Chrome artifact in dist/
npm run build:firefox  # Firefox artifact in dist-firefox/
npm run build:all      # Build both browsers
```

The regular Vite preview supplies a deterministic example page because browser
extension APIs are only available after loading the built extension.

## Project structure

```text
src/
├── app/             # Application composition and global styles
├── domain/          # Framework-independent knowledge and sync models
├── entrypoints/     # Popup and background runtime bootstraps
├── features/        # Capture, library, settings, and sync workflows
├── infrastructure/  # Browser, GitHub, Markdown, and IndexedDB adapters
└── shared/          # Generic UI and utility code
```

See [Project structure](./docs/architecture/project-structure.md) for ownership
rules and guidance for new modules.

## Troubleshooting

### The popup still shows an older version

Rebuild the correct browser target and reload the extension from
`chrome://extensions` or `about:debugging`.

### GitHub returns 403

Recreate the fine-grained token with the correct resource owner, **All
repositories**, Administration write, and Contents write. Organization policies
may require administrator approval.

### GitHub says the repository or branch is unavailable

For an existing repository, make sure it has an initial commit and that the
configured branch exists. Automatically created repositories are initialized
for you.

### A save appears in Library but not GitHub

Local storage is authoritative. The change remains in the durable queue and is
retried by the browser background runtime. Open Settings to see queued or failed
sync status and trigger another sync.
