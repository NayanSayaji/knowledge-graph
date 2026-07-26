import Dexie, { type EntityTable, type Table } from "dexie";
import type { KnowledgeNode } from "@/domain/knowledge-node/model";
import type { SyncJob } from "@/domain/sync/model";

export class KnowledgeGraphDatabase extends Dexie {
  nodes!: EntityTable<KnowledgeNode, "id">;
  syncJobs!: Table<SyncJob, number>;

  constructor() {
    // Keep the original database identifier so existing MVP data survives the
    // product rename to KnowlegeGraph.
    super("threadmark");
    this.version(1).stores({
      nodes: "id, title, slug, archived, favorite, createdAt, updatedAt, *tags, *sections",
    });
    this.version(2).stores({
      nodes: "id, title, slug, archived, favorite, createdAt, updatedAt, *tags, *sections",
      syncJobs: "++id,status,operation,nodeId,createdAt,claimedAt",
    });
  }
}

export const database = new KnowledgeGraphDatabase();
