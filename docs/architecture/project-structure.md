# Project structure

```text
.
├── docs/
│   ├── architecture/       # System design and code organization
│   ├── development/        # Contributor, testing, and release workflows
│   ├── features/           # User-visible implementation flows
│   ├── infrastructure/     # Browser and persistence implementation
│   └── product/            # Vision, requirements, and roadmap
├── manifests/
│   └── firefox.json         # Firefox-specific Manifest V3 metadata
 ├── portal/
│   ├── src/                 # Generated documentation website
│   │   ├── app/             # Portal shell, routing, and data bootstrapping
│   │   ├── components/      # Shared presentation pieces used across pages
│   │   ├── data/            # Preview fixtures and local fallback data
│   │   ├── features/        # Route-level portal pages
│   │   └── lib/             # Portal utilities and derived data helpers
│   ├── deploy-pages.yml     # GitHub Pages workflow template
│   └── vite.config.ts       # Standalone static portal build
├── public/
│   └── manifest.json       # Chrome Manifest V3 metadata copied into dist
├── scripts/
│   └── prepare-firefox.mjs # Installs the Firefox manifest after Vite build
├── src/
│   ├── app/
│   │   ├── App.tsx         # Top-level state and navigation composition
│   │   └── styles/         # Global popup theme and component styles
│   ├── domain/
│   │   └── knowledge-node/ # Framework-independent models and rules
│   ├── entrypoints/
│   │   ├── background/     # Extension service worker entry
│   │   └── popup/          # React popup entry
│   ├── features/
│   │   ├── capture/        # Create/edit form and validation
│   │   ├── library/        # Search, filters, cards, and node actions
│   │   ├── settings/       # Data transfer and application settings
│   │   └── sync/           # GitHub settings UI and sync orchestration
│   ├── infrastructure/
│   │   ├── browser/        # Chrome/WebExtensions adapters
│   │   ├── github/         # GitHub API and credential settings
│   │   ├── markdown/       # Repository artifact generation
│   │   ├── portal/         # Raw portal template synchronization
│   │   └── storage/        # Dexie database, repositories, sync queue
│   └── shared/
│       ├── lib/            # Generic pure utility functions
│       └── ui/             # Reusable presentational primitives
├── index.html              # Vite popup HTML entry
├── vite.config.ts          # Popup/background multi-entry build
└── tsconfig*.json          # Browser app and tooling TypeScript projects
```

The extension and portal are separate Vite entry surfaces. The extension owns
capture, local persistence, and synchronization. The portal is static,
read-only, and consumes only generated repository artifacts.

## Placement rules

### Add to `domain/` when

The code describes business data or a pure business rule and can run without a
browser, React, or a database. Examples: node types, relation types, slug rules.

### Add to `features/` when

The code implements a user workflow. Keep each feature's components, hooks,
schemas, and model helpers together. A feature may use infrastructure services,
but should not know Dexie table definitions or raw Chrome API details.

### Add to `infrastructure/` when

The code talks to a runtime boundary: IndexedDB, Chrome APIs, GitHub, Markdown
files, or a future network service. Infrastructure returns domain objects rather
than leaking vendor-specific values into features.

### Add to `shared/` when

The code is genuinely reusable and carries no domain or feature meaning.
Examples are icons, URL parsing, and generic collection parsing. Do not move
code here merely because two files use it; prefer clear ownership.

### Add to `app/` when

The code coordinates multiple features or defines application-wide providers,
routing, error boundaries, or global styling. Business workflows should remain
inside features.

### Add to `entrypoints/` when

The browser or build tool directly loads the file. Entrypoints should bootstrap
and delegate, not contain product logic.

## Import convention

Application modules use the `@/` alias for imports rooted at `src`. Relative
imports are reserved for files within the same small module, such as a feature
component importing its adjacent model helper.

This makes moves between features explicit and avoids fragile chains such as
`../../../../shared`.

## Test placement

Tests are colocated with the unit they verify:

```text
search-nodes.ts
search-nodes.test.ts
```

This keeps ownership obvious and makes it harder for implementation and tests
to drift apart. Cross-feature end-to-end tests can later live in a root `e2e/`
directory.
