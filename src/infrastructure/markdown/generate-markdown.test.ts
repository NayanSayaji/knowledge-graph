import { describe, expect, it } from "vitest";
import type { KnowledgeNode } from "@/domain/knowledge-node/model";
import {
  generateGraphJson,
  generateKnowledgeReadme,
  generateNodeMarkdown,
} from "./generate-markdown";

const node: KnowledgeNode = {
  id: "node-1",
  title: "CAP Theorem",
  slug: "cap-theorem",
  summary: "Distributed systems trade-offs.",
  notes: "Choose two is an oversimplification.",
  keywords: ["consistency"],
  tags: ["interview"],
  sections: ["HLD"],
  resources: [
    {
      title: "Reference",
      url: "https://example.com/cap",
      type: "article",
      website: "example.com",
    },
  ],
  relations: [{ targetId: "node-2", type: "related" }],
  archived: false,
  favorite: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("GitHub artifact generation", () => {
  it("generates portable node Markdown", () => {
    const markdown = generateNodeMarkdown(node);
    expect(markdown).toContain("# CAP Theorem");
    expect(markdown).toContain("sections:\n  - \"HLD\"");
    expect(markdown).toContain("[Reference](https://example.com/cap)");
  });

  it("generates graph metadata", () => {
    const graph = JSON.parse(generateGraphJson([node]));
    expect(graph.version).toBe(2);
    expect(graph.nodes[0]).toMatchObject({
      id: "node-1",
      notes: "Choose two is an oversimplification.",
      resources: [expect.objectContaining({ url: "https://example.com/cap" })],
      relations: [{ targetId: "node-2", type: "related" }],
    });
  });

  it("generates a section index", () => {
    const readme = generateKnowledgeReadme(
      [
        node,
        {
          ...node,
          id: "legacy-duplicate",
          updatedAt: "2025-12-01T00:00:00.000Z",
        },
      ],
      "knowledge",
    );
    expect(readme).toContain(
      "[CAP Theorem](knowledge/nodes/cap-theorem.md)",
    );
    expect(readme).toContain("![Knowledge nodes]");
    expect(readme).toContain("<details open>");
    expect(readme).toContain("<strong>HLD</strong> · 1 topic");
  });
});
