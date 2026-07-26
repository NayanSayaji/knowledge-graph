import Fuse from "fuse.js";
import type { KnowledgeNode } from "@/domain/knowledge-node/model";

export function searchNodes(nodes: KnowledgeNode[], query: string) {
  if (!query.trim()) return nodes;

  const index = new Fuse(nodes, {
    threshold: 0.34,
    keys: [
      "title",
      "summary",
      "notes",
      "tags",
      "keywords",
      "sections",
      "resources.url",
    ],
  });

  return index.search(query).map((result) => result.item);
}
