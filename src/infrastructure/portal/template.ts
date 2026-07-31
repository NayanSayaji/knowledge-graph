import appSource from "../../../portal/src/app/PortalApp.tsx?raw";
import dataContextSource from "../../../portal/src/app/PortalDataContext.tsx?raw";
import routerSource from "../../../portal/src/app/PortalRouter.tsx?raw";
import topicListSource from "../../../portal/src/components/TopicList.tsx?raw";
import previewNodesSource from "../../../portal/src/data/previewNodes.ts?raw";
import homeSource from "../../../portal/src/features/home/HomePage.tsx?raw";
import sectionSource from "../../../portal/src/features/section/SectionPage.tsx?raw";
import timelineSource from "../../../portal/src/features/timeline/TimelinePage.tsx?raw";
import statsSource from "../../../portal/src/features/stats/StatsPage.tsx?raw";
import markdownSource from "../../../portal/src/features/topic/MarkdownDocument.tsx?raw";
import topicSource from "../../../portal/src/features/topic/TopicPage.tsx?raw";
import portalDataSource from "../../../portal/src/lib/portal-data.ts?raw";
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
    { path: "portal/src/app/PortalApp.tsx", content: appSource },
    { path: "portal/src/app/PortalDataContext.tsx", content: dataContextSource },
    { path: "portal/src/app/PortalRouter.tsx", content: routerSource },
    { path: "portal/src/components/TopicList.tsx", content: topicListSource },
    { path: "portal/src/data/previewNodes.ts", content: previewNodesSource },
    { path: "portal/src/features/home/HomePage.tsx", content: homeSource },
    { path: "portal/src/features/section/SectionPage.tsx", content: sectionSource },
    { path: "portal/src/features/timeline/TimelinePage.tsx", content: timelineSource },
    { path: "portal/src/features/stats/StatsPage.tsx", content: statsSource },
    { path: "portal/src/features/topic/MarkdownDocument.tsx", content: markdownSource },
    { path: "portal/src/features/topic/TopicPage.tsx", content: topicSource },
    { path: "portal/src/lib/portal-data.ts", content: portalDataSource },
    { path: "portal/src/types.ts", content: typesSource },
    { path: "portal/src/styles.css", content: stylesSource },
    {
      path: ".github/workflows/deploy-knowledge-portal.yml",
      content: deploymentWorkflow,
    },
  ];
}
