import { copyFile } from "node:fs/promises";

await copyFile("manifests/firefox.json", "dist-firefox/manifest.json");
