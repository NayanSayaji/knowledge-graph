import type { KnowledgeNode, NodeDraft } from "@/domain/knowledge-node/model";
import { slugify } from "@/domain/knowledge-node/slug";
import { requestBackgroundSync } from "@/infrastructure/browser/sync-trigger";
import { database } from "./database";
import {
  enqueueNodeDelete,
  enqueueNodeUpsert,
} from "./sync-queue";

export async function saveNode(draft: NodeDraft, existing?: KnowledgeNode) {
  const now = new Date().toISOString();
  const node: KnowledgeNode = {
    ...draft,
    id: existing?.id ?? crypto.randomUUID(),
    slug: slugify(draft.title),
    archived: existing?.archived ?? false,
    favorite: existing?.favorite ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await database.transaction(
    "rw",
    [database.nodes, database.syncJobs],
    async () => {
      await database.nodes.put(node);
      if (existing && existing.slug !== node.slug) {
        await enqueueNodeDelete(`nodes/${existing.slug}.md`);
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
