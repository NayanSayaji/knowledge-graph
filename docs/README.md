# KnowlegeGraph documentation

This folder is the engineering and product reference for KnowlegeGraph. The root
`README.md` is intentionally limited to setup and common commands; detailed
implementation decisions live here.

## Start here

| Document | Purpose |
| --- | --- |
| [Architecture overview](architecture/overview.md) | System boundaries, dependency rules, and runtime data flow |
| [Project structure](architecture/project-structure.md) | Directory responsibilities and where new code belongs |
| [Product HLD](product/high-level-design.md) | Original vision, requirements, roadmap, and target architecture |

## Feature implementation

| Document | Purpose |
| --- | --- |
| [Capture and editing](features/capture-and-editing.md) | Current-tab detection, context-menu capture, validation, and saves |
| [Library and search](features/library-and-search.md) | Live queries, fuzzy search, filters, and node actions |
| [Import and export](features/import-and-export.md) | Portable JSON backups and transactional imports |
| [GitHub sync](features/github-sync.md) | Repository setup, queue processing, artifacts, retries, and security |

## Infrastructure and operations

| Document | Purpose |
| --- | --- |
| [Storage and data model](infrastructure/storage-and-data-model.md) | IndexedDB schema, repository API, and model design |
| [Browser extension runtime](infrastructure/browser-extension-runtime.md) | Manifest, popup, background worker, permissions, and build outputs |
| [Development and testing](development/testing-and-release.md) | Local workflow, test strategy, build validation, and release checklist |

## Documentation convention

- Product intent belongs in `product/`.
- Cross-cutting technical decisions belong in `architecture/`.
- User-visible workflows belong in `features/`.
- Browser, persistence, sync, and other adapters belong in `infrastructure/`.
- Contributor workflows belong in `development/`.

Update the relevant document in the same change whenever behavior, storage
format, permissions, or architectural boundaries change.
