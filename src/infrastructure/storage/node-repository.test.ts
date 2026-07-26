import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { slugify } from "@/domain/knowledge-node/slug";
import { importGraph } from "./graph-transfer";
import { database } from "./database";
import { saveNode } from "./node-repository";

const draft = {
  title: "CAP Theorem",
  summary: "Consistency, availability, and partition tolerance.",
  notes: "",
  keywords: ["distributed systems"],
  tags: ["interview"],
  sections: ["HLD"],
  resources: [],
  relations: [],
};

afterEach(async () => {
  await database.nodes.clear();
});

describe("knowledge storage", () => {
  it("creates stable slugs", () => {
    expect(slugify(" Redis: Streams & Pub/Sub ")).toBe("redis-streams-pub-sub");
  });

  it("persists a node with timestamps", async () => {
    const node = await saveNode(draft);
    expect(await database.nodes.get(node.id)).toMatchObject({
      title: "CAP Theorem",
      slug: "cap-theorem",
      archived: false,
    });
  });

  it("imports exported nodes", async () => {
    await importGraph(JSON.stringify({ nodes: [{ ...draft, id: "1", slug: "cap-theorem", archived: false, favorite: false, createdAt: "2025-01-01", updatedAt: "2025-01-01" }] }));
    expect(await database.nodes.count()).toBe(1);
  });
});
