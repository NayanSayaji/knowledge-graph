import type { KnowledgeNode } from "@/domain/knowledge-node/model";
import { requestBackgroundSync } from "@/infrastructure/browser/sync-trigger";
import { database } from "./database";
import { enqueueFullSync } from "./sync-queue";

interface GraphExport {
  version: 1;
  exportedAt: string;
  nodes: KnowledgeNode[];
}

function isGraphExport(value: unknown): value is Pick<GraphExport, "nodes"> {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodes" in value &&
    Array.isArray(value.nodes)
  );
}

export async function exportGraph() {
  const payload: GraphExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    nodes: await database.nodes.toArray(),
  };

  return JSON.stringify(payload, null, 2);
}

export async function importGraph(raw: string) {
  const data: unknown = JSON.parse(raw);
  if (!isGraphExport(data)) {
    throw new Error("That file is not a KnowlegeGraph export.");
  }

  await database.transaction(
    "rw",
    [database.nodes, database.syncJobs],
    async () => {
    await database.nodes.bulkPut(data.nodes);
      await enqueueFullSync();
    },
  );
  requestBackgroundSync();
}
