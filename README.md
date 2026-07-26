# KnowlegeGraph

KnowlegeGraph is an offline-first browser extension that turns useful pages and
ideas into a searchable personal knowledge graph.

Detailed design and implementation documentation starts at
[docs/README.md](./docs/README.md).

## MVP features

- Capture the current tab's title and URL automatically
- Capture selected text from the browser context menu
- Create, edit, archive, favorite, and delete knowledge nodes
- Organize nodes with sections, tags, keywords, summaries, and Markdown notes
- Fuzzy search across titles, notes, metadata, and URLs
- Persist everything locally in IndexedDB
- Import and export the complete graph as portable JSON
- Sync Markdown, `graph.json`, and a generated index to GitHub
- Create an initialized private GitHub repository automatically
- Resolve repository-name collisions with `_1`, `_2`, and later suffixes
- Queue changes offline and retry them from the background worker

Richer relationship editing remains in the next product phases described in the
[product HLD](./docs/product/high-level-design.md). See
[GitHub sync](./docs/features/github-sync.md) for repository setup.

GitHub setup is guided from Settings: create a preconfigured fine-grained token,
paste it into KnowlegeGraph, edit the default `knowlege-base` repository name if
desired, and select **Create repository & sync**. If the name already exists,
KnowlegeGraph tries `knowlege-base_1`, `knowlege-base_2`, and so on.

## Architecture

```text
src/
├── app/             # Application composition and global styles
├── domain/          # Framework-independent knowledge model
├── entrypoints/     # Popup and background worker bootstraps
├── features/        # Capture, library, and settings workflows
├── infrastructure/  # Browser adapters and IndexedDB persistence
└── shared/          # Generic UI and utility code
```

See [Project structure](./docs/architecture/project-structure.md) for ownership
rules and guidance for adding new modules.

## Run locally

```bash
npm install
npm run dev
```

The regular browser preview includes a safe example page capture so the popup
can be developed without the extension APIs.

## Load the extension

```bash
npm run build
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this project's `dist` directory.
4. Pin KnowlegeGraph and open it from any page.

Firefox support can be added by packaging the same WebExtensions code with a
Firefox-specific manifest.

## Verify

```bash
npm run typecheck
npm test
npm run build
```
