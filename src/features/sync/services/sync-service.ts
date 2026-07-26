import type { SyncJob } from "@/domain/sync/model";
import { GitHubClient } from "@/infrastructure/github/github-client";
import { getGitHubSettings } from "@/infrastructure/github/settings";
import {
  generateGraphJson,
  generateKnowledgeReadme,
  generateNodeMarkdown,
} from "@/infrastructure/markdown/generate-markdown";
import { database } from "@/infrastructure/storage/database";
import {
  claimPendingJobs,
  completeJobs,
  releaseJobs,
} from "@/infrastructure/storage/sync-queue";

export interface SyncResult {
  synced: number;
  commit?: string;
  skipped?: "disabled" | "not_configured" | "empty_queue";
}

function prefixPath(directory: string, path: string) {
  return `${directory.replace(/^\/+|\/+$/g, "")}/${path}`;
}

function isConfigured(
  settings: Awaited<ReturnType<typeof getGitHubSettings>>,
) {
  return Boolean(
    settings.owner &&
      settings.repository &&
      settings.branch &&
      settings.directory &&
      settings.token,
  );
}

function changedNodeIds(jobs: SyncJob[]) {
  return new Set(
    jobs
      .filter((job) => job.operation === "upsert" && job.nodeId)
      .map((job) => job.nodeId!),
  );
}

export async function syncPendingJobs(options?: {
  ignoreDisabled?: boolean;
}): Promise<SyncResult> {
  const settings = await getGitHubSettings();
  if (!settings.enabled && !options?.ignoreDisabled) {
    return { synced: 0, skipped: "disabled" };
  }
  if (!isConfigured(settings)) {
    return { synced: 0, skipped: "not_configured" };
  }

  const jobs = await claimPendingJobs();
  if (!jobs.length) return { synced: 0, skipped: "empty_queue" };

  try {
    const allNodes = await database.nodes.toArray();
    const fullRefresh = jobs.some((job) => job.operation === "refresh");
    const ids = changedNodeIds(jobs);
    const changedNodes = fullRefresh
      ? allNodes
      : allNodes.filter((node) => ids.has(node.id));
    const rawChanges = [
      ...changedNodes.map((node) => ({
        path: prefixPath(settings.directory, `nodes/${node.slug}.md`),
        content: generateNodeMarkdown(node),
      })),
      ...jobs
        .filter((job) => job.operation === "delete" && job.path)
        .map((job) => ({
          path: prefixPath(settings.directory, job.path!),
          delete: true,
        })),
      {
        path: prefixPath(settings.directory, "graph.json"),
        content: generateGraphJson(allNodes),
      },
      {
        path: prefixPath(settings.directory, "README.md"),
        content: generateKnowledgeReadme(allNodes),
      },
    ];
    const changes = [
      ...new Map(rawChanges.map((change) => [change.path, change])).values(),
    ];

    const commit = await new GitHubClient(settings).commitChanges(
      changes,
      `Sync ${jobs.length} KnowlegeGraph change${jobs.length === 1 ? "" : "s"}`,
    );
    await completeJobs(jobs);
    return { synced: jobs.length, commit };
  } catch (error) {
    await releaseJobs(jobs, error);
    throw error;
  }
}
