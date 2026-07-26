# Development, testing, and release

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Chrome or another Manifest V3-compatible browser

## Commands

```bash
npm install          # Install locked dependencies
npm run dev          # Start the popup UI development server
npm run typecheck    # Validate all TypeScript projects
npm test             # Run unit and storage tests once
npm run build        # Typecheck and create dist/
```

## Local extension installation

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the generated `dist/` directory.
6. Reload the extension after each new build.

The Vite development server is useful for popup layout and feature work but
does not emulate all extension APIs. Context menus and active-tab behavior must
be verified through the unpacked extension.

## Test strategy

### Current unit tests

- slug normalization;
- node creation and persistence;
- graph import writes;
- empty-query search behavior;
- fuzzy metadata search;
- resource URL search.
- Markdown, graph metadata, and repository index generation;
- durable sync queue claim, completion, and retry behavior.
- automatic repository naming, collision suffixes, and initialization requests.

Storage tests use `fake-indexeddb`, so they run deterministically without a real
browser.

### Next test layers

1. Component tests for capture validation and library filtering.
2. Database migration tests for every Dexie schema version.
3. Browser-extension integration tests for popup/background handoff.
4. Playwright tests against a loaded extension for capture, edit, archive, and
   import/export workflows.

## Release checklist

- [ ] Update the package and manifest versions together.
- [ ] Update docs for storage, permission, or behavior changes.
- [ ] Run `npm ci`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Confirm `dist/manifest.json` references `background.js`.
- [ ] Load `dist/` as an unpacked extension.
- [ ] Verify active-tab capture and context-menu capture.
- [ ] Verify GitHub connection, immediate sync, and background retry.
- [ ] Verify save, edit, search, archive, delete, export, and import.
- [ ] Check the popup at its minimum supported dimensions.
- [ ] Package the contents of `dist/`, not the repository root.

## Security review points

- Request only permissions needed by a shipped feature.
- Treat imported JSON as untrusted input.
- Do not place GitHub or other service tokens in source, exports, repository
  artifacts, or bundled environment variables.
- Store future tokens using an appropriate browser authentication flow and
  document their lifecycle.
- Keep remote code out of the extension bundle to comply with Manifest V3.
