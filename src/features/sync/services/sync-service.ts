import type {
  KnowledgeNode,
  NodeDraft,
  Resource,
} from "@/domain/knowledge-node/model";
import {
  findMatchingNode,
  mergeNodeDraft,
} from "@/domain/knowledge-node/merge";
import type { GitHubSyncSettings, SyncJob } from "@/domain/sync/model";
import { GitHubClient } from "@/infrastructure/github/github-client";
import { getGitHubSettings } from "@/infrastructure/github/settings";
import {
  generateGraphJson,
  generateKnowledgeReadme,
  generateNodeMarkdown,
  generateSectionsJson,
  generateStatsJson,
} from "@/infrastructure/markdown/generate-markdown";
import { parseGeneratedNodeMarkdown } from "@/infrastructure/markdown/parse-markdown";
import { getPortalTemplateChanges } from "@/infrastructure/portal/template";
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

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asResources(value: unknown): Resource[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Resource =>
          typeof item === "object" &&
          item !== null &&
          "url" in item &&
          typeof item.url === "string",
      )
    : [];
}

function toNodeDraft(node: KnowledgeNode): NodeDraft {
  const {
    id: _id,
    slug: _slug,
    archived: _archived,
    favorite: _favorite,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...draft
  } = node;
  return draft;
}

async function mapInBatches<T, R>(
  values: T[],
  mapper: (value: T) => Promise<R>,
) {
  const results: R[] = [];
  for (let index = 0; index < values.length; index += 6) {
    results.push(
      ...(await Promise.all(values.slice(index, index + 6).map(mapper))),
    );
  }
  return results;
}

async function hydrateRemoteNodes(
  rawNodes: unknown[],
  version: number,
  client: GitHubClient,
  directory: string,
) {
  return mapInBatches(rawNodes, async (value) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      typeof value.id !== "string" ||
      !("title" in value) ||
      typeof value.title !== "string"
    ) {
      return undefined;
    }

    const raw = value as Partial<KnowledgeNode>;
    const updatedAt =
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString();
    let legacy = { summary: "", notes: "", resources: [] as Resource[] };
    if (version < 2 && typeof raw.slug === "string") {
      const markdown = await client.getFileText(
        prefixPath(directory, `nodes/${raw.slug}.md`),
      );
      if (markdown) legacy = parseGeneratedNodeMarkdown(markdown);
    }

    return {
      id: raw.id!,
      title: raw.title!,
      slug:
        typeof raw.slug === "string"
          ? raw.slug
          : raw.title!.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      summary:
        typeof raw.summary === "string" ? raw.summary : legacy.summary,
      notes: typeof raw.notes === "string" ? raw.notes : legacy.notes,
      keywords: asStringArray(raw.keywords),
      tags: asStringArray(raw.tags),
      sections: asStringArray(raw.sections),
      resources:
        asResources(raw.resources).length > 0
          ? asResources(raw.resources)
          : legacy.resources,
      relations: Array.isArray(raw.relations) ? raw.relations : [],
      archived: Boolean(raw.archived),
      favorite: Boolean(raw.favorite),
      createdAt:
        typeof raw.createdAt === "string" ? raw.createdAt : updatedAt,
      updatedAt,
    } satisfies KnowledgeNode;
  });
}

export async function restoreRemoteGraph(
  settings: GitHubSyncSettings,
): Promise<{ restored: number; found: boolean }> {
  if (!isConfigured(settings)) return { restored: 0, found: false };

  const client = new GitHubClient(settings);
  const content = await client.getFileText(
    prefixPath(settings.directory, "graph.json"),
  );
  if (!content) return { restored: 0, found: false };

  const payload = JSON.parse(content) as { version?: number; nodes?: unknown[] };
  if (!Array.isArray(payload.nodes)) {
    throw new Error("The remote graph.json does not contain a node collection.");
  }
  const hydrated = (
    await hydrateRemoteNodes(
      payload.nodes,
      payload.version ?? 1,
      client,
      settings.directory,
    )
  ).filter((node): node is KnowledgeNode => Boolean(node));

  await database.transaction("rw", database.nodes, async () => {
    const localNodes = await database.nodes.toArray();
    for (const remote of hydrated) {
      const local =
        localNodes.find((node) => node.id === remote.id) ??
        findMatchingNode(localNodes, toNodeDraft(remote));
      if (!local) {
        await database.nodes.put(remote);
        localNodes.push(remote);
        continue;
      }

      const remoteIsNewer = remote.updatedAt > local.updatedAt;
      const mergedDraft = remoteIsNewer
        ? mergeNodeDraft(local, toNodeDraft(remote))
        : mergeNodeDraft(remote, toNodeDraft(local));
      const merged: KnowledgeNode = {
        ...(remoteIsNewer ? remote : local),
        ...mergedDraft,
        id: local.id,
        createdAt:
          local.createdAt < remote.createdAt
            ? local.createdAt
            : remote.createdAt,
        updatedAt:
          local.updatedAt > remote.updatedAt
            ? local.updatedAt
            : remote.updatedAt,
      };
      await database.nodes.put(merged);
      const index = localNodes.findIndex((node) => node.id === local.id);
      localNodes[index] = merged;
    }
  });

  return { restored: hydrated.length, found: true };
}

export async function restoreRemoteGraphIfLocalEmpty() {
  const [nodeCount, queueCount, settings] = await Promise.all([
    database.nodes.count(),
    database.syncJobs.count(),
    getGitHubSettings(),
  ]);
  if (nodeCount > 0 || queueCount > 0 || !settings.enabled) {
    return { restored: 0, found: false };
  }
  return restoreRemoteGraph(settings);
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
        path: prefixPath(settings.directory, "sections.json"),
        content: generateSectionsJson(allNodes),
      },
      {
        path: prefixPath(settings.directory, "stats.json"),
        content: generateStatsJson(allNodes),
      },
      {
        path: "README.md",
        content: generateKnowledgeReadme(
          allNodes,
          settings.directory,
          `https://${settings.owner.toLowerCase()}.github.io/${settings.repository}/`,
        ),
      },
      {
        path: prefixPath(settings.directory, "README.md"),
        delete: true,
      },
      ...getPortalTemplateChanges(settings.directory, settings.branch),
    ];
    const changes = [
      ...new Map(rawChanges.map((change) => [change.path, change])).values(),
    ];

    const client = new GitHubClient(settings);
    await client.ensurePagesWorkflow();
    const commit = await client.commitChanges(
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
