import { describe, expect, it } from "vitest";
import type { KnowledgeNode } from "@/domain/knowledge-node/model";
import { searchNodes } from "./search-nodes";

function node(overrides: Partial<KnowledgeNode>): KnowledgeNode {
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    slug: "untitled",
    summary: "",
    notes: "",
    keywords: [],
    tags: [],
    sections: [],
    resources: [],
    relations: [],
    archived: false,
    favorite: false,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
    ...overrides,
  };
}

describe("node search", () => {
  const nodes = [
    node({
      title: "CAP Theorem",
      keywords: ["consistency", "availability"],
      sections: ["HLD"],
    }),
    node({
      title: "Redis Streams",
      tags: ["backend"],
      resources: [
        {
          title: "Redis docs",
          url: "https://redis.io/docs",
          type: "documentation",
          website: "redis.io",
        },
      ],
    }),
  ];

  it("returns all nodes for an empty query", () => {
    expect(searchNodes(nodes, "")).toEqual(nodes);
  });

  it("searches across metadata", () => {
    expect(searchNodes(nodes, "availability")[0].title).toBe("CAP Theorem");
  });

  it("searches resource URLs", () => {
    expect(searchNodes(nodes, "redis.io")[0].title).toBe("Redis Streams");
  });
});
