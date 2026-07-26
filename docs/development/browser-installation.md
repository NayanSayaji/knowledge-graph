# Browser installation

KnowlegeGraph produces separate development artifacts for Chrome and Firefox
because the browsers use different Manifest V3 background declarations.

## Chrome

Build:

```bash
npm run build:chrome
```

Install:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `dist/`.

Chrome loads `background.js` through `background.service_worker`.

After rebuilding, use the reload control on the extension card. Reloading
preserves the extension's IndexedDB and local configuration.

## Firefox

Build:

```bash
npm run build:firefox
```

Install temporarily:

1. Open `about:debugging`.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose `dist-firefox/manifest.json`.

Firefox loads `background.js` through `background.scripts` as a non-persistent
Manifest V3 event page. Temporary installation ends when Firefox restarts.

Mozilla documents the temporary installation process in the
[Firefox Extension Workshop](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

## Why two manifests?

Chrome Manifest V3 requires `background.service_worker`. Firefox currently uses
`background.scripts` and does not support extension service workers. Both
background formats can load modules, so the application code and Vite bundles
are shared while only manifest metadata changes.

See MDN's
[cross-browser background reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
for the current compatibility matrix.

## Permanent Firefox installation

End users cannot permanently install an unsigned development build in standard
Firefox. For distribution:

1. package the contents of `dist-firefox/`;
2. submit or sign the package through Mozilla Add-ons;
3. keep the Gecko ID in `manifests/firefox.json` stable across releases.

Manifest V3 extensions require a stable add-on ID before AMO submission. See
Mozilla's [add-on ID guidance](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/).
