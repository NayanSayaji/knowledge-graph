import type { KnowledgeNode, NodeDraft } from "@/domain/knowledge-node/model";
import {
  findMatchingNode,
  mergeNodeDraft,
} from "@/domain/knowledge-node/merge";
import { slugify } from "@/domain/knowledge-node/slug";
import { requestBackgroundSync } from "@/infrastructure/browser/sync-trigger";
import { database } from "./database";
import {
  enqueueNodeDelete,
  enqueueNodeUpsert,
} from "./sync-queue";

export async function saveNode(draft: NodeDraft, existing?: KnowledgeNode) {
  const now = new Date().toISOString();
  let node!: KnowledgeNode;

  await database.transaction(
    "rw",
    [database.nodes, database.syncJobs],
    async () => {
      const matched =
        existing ??
        findMatchingNode(await database.nodes.toArray(), draft);
      const mergedDraft = matched ? mergeNodeDraft(matched, draft) : draft;
      const preservePrimaryFields = Boolean(matched && !existing);
      const matchedNode = matched;
      node = {
        ...mergedDraft,
        title: preservePrimaryFields ? matchedNode!.title : mergedDraft.title,
        summary: preservePrimaryFields ? matchedNode!.summary : mergedDraft.summary,
        notes: preservePrimaryFields ? matchedNode!.notes : mergedDraft.notes,
        id: matchedNode?.id ?? crypto.randomUUID(),
        slug: preservePrimaryFields ? matchedNode!.slug : slugify(mergedDraft.title),
        archived: matchedNode?.archived ?? false,
        favorite: matchedNode?.favorite ?? false,
        createdAt: matchedNode?.createdAt ?? now,
        updatedAt: now,
      };
      await database.nodes.put(node);
      if (matchedNode && matchedNode.slug !== node.slug) {
        await enqueueNodeDelete(`nodes/${matchedNode.slug}.md`);
      }
      await enqueueNodeUpsert(node.id);
    },
  );
  requestBackgroundSync();
  return node;
}

export async function archiveNode(id: string) {
  await database.transaction(
    "rw",
    [database.nodes, database.syncJobs],
    async () => {
      await database.nodes.update(id, { archived: true });
      await enqueueNodeUpsert(id);
    },
  );
  requestBackgroundSync();
}

export async function deleteNode(id: string) {
  await database.transaction(
    "rw",
    [database.nodes, database.syncJobs],
    async () => {
      const node = await database.nodes.get(id);
      if (!node) return;
      await database.nodes.delete(id);
      await enqueueNodeDelete(`nodes/${node.slug}.md`);
    },
  );
  requestBackgroundSync();
}

export async function setFavorite(id: string, favorite: boolean) {
  await database.transaction(
    "rw",
    [database.nodes, database.syncJobs],
    async () => {
      await database.nodes.update(id, { favorite });
      await enqueueNodeUpsert(id);
    },
  );
  requestBackgroundSync();
}
