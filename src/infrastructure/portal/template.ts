import appSource from "../../../portal/src/App.tsx?raw";
import markdownSource from "../../../portal/src/MarkdownDocument.tsx?raw";
import mainSource from "../../../portal/src/main.tsx?raw";
import stylesSource from "../../../portal/src/styles.css?raw";
import typesSource from "../../../portal/src/types.ts?raw";
import indexSource from "../../../portal/index.html?raw";
import packageLockSource from "../../../portal/package-lock.json?raw";
import packageSource from "../../../portal/package.json?raw";
import tsconfigSource from "../../../portal/tsconfig.json?raw";
import viteConfigSource from "../../../portal/vite.config.ts?raw";
import workflowSource from "../../../portal/deploy-pages.yml?raw";

export function getPortalTemplateChanges(
  directory = "knowledge",
  branch = "main",
) {
  const normalizedDirectory = directory.replace(/^\/+|\/+$/g, "");
  if (
    !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(normalizedDirectory)
  ) {
    throw new Error(
      "The knowledge directory contains characters that cannot be used in the Pages workflow.",
    );
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(branch)) {
    throw new Error(
      "The sync branch contains characters that cannot be used in the Pages workflow.",
    );
  }
  const deploymentWorkflow = workflowSource
    .replaceAll("__KNOWLEDGE_DIRECTORY__", normalizedDirectory)
    .replaceAll("__SYNC_BRANCH__", branch);
  return [
    { path: "portal/index.html", content: indexSource },
    { path: "portal/package.json", content: packageSource },
    { path: "portal/package-lock.json", content: packageLockSource },
    { path: "portal/tsconfig.json", content: tsconfigSource },
    { path: "portal/vite.config.ts", content: viteConfigSource },
    { path: "portal/src/main.tsx", content: mainSource },
    { path: "portal/src/App.tsx", content: appSource },
    { path: "portal/src/MarkdownDocument.tsx", content: markdownSource },
    { path: "portal/src/types.ts", content: typesSource },
    { path: "portal/src/styles.css", content: stylesSource },
    {
      path: ".github/workflows/deploy-knowledge-portal.yml",
      content: deploymentWorkflow,
    },
  ];
}
