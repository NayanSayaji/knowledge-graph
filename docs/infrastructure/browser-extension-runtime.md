# Browser extension runtime

## Manifest

`public/manifest.json` is copied unchanged into `dist/manifest.json`.

The extension uses Manifest V3 and requests:

| Permission | Reason |
| --- | --- |
| `activeTab` | Read the current tab after the user opens the popup |
| `storage` | Transfer a pending context-menu capture to the popup |
| `contextMenus` | Register **Save to Threadmark** |

No host permissions are required for the MVP. Page contents are not scraped.

## Popup entrypoint

`index.html` loads `src/entrypoints/popup/main.tsx`. The entrypoint mounts React
in strict mode and imports global styles. Product behavior is delegated to the
app and feature layers.

Chrome popups are short-lived documents: closing the popup destroys React
state. Durable state therefore lives in IndexedDB, while active view and form
state are intentionally ephemeral.

## Background entrypoint

`src/entrypoints/background/index.ts` is compiled as a distinct
`background.js` file because the manifest must reference a stable service-worker
name.

On installation, it registers the context menu. On click, it collects:

- the current tab title;
- clicked-link URL or tab URL;
- selected text, when present.

It writes this payload to `chrome.storage.local` and attempts to open the popup.
Popup opening is best-effort because browser policy can reject it in some
contexts; the pending payload remains available for the next manual open.

## Build

Vite has two Rollup inputs:

1. `index.html` for the popup;
2. the background TypeScript entrypoint.

Hashed filenames are used for popup CSS and JavaScript. The background entry has
the fixed `background.js` filename expected by the manifest.

Expected production output:

```text
dist/
├── assets/
│   ├── popup-[hash].css
│   └── popup-[hash].js
├── background.js
├── index.html
└── manifest.json
```

## Cross-browser direction

The code uses WebExtensions-compatible Chrome APIs and React does not depend on
Chrome. Firefox packaging may require a browser-specific manifest and testing
of `action.openPopup`. If API divergence grows, add a typed browser adapter
rather than conditional checks inside feature components.
