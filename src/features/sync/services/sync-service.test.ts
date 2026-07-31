import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GitHubSyncSettings } from "@/domain/sync/model";
import { database } from "@/infrastructure/storage/database";
import { restoreRemoteGraph } from "./sync-service";

const settings: GitHubSyncSettings = {
  enabled: true,
  owner: "octocat",
  repository: "knowledge-base",
  branch: "main",
  directory: "knowledge",
  token: "test-token",
};

afterEach(async () => {
  await database.nodes.clear();
  await database.syncJobs.clear();
  vi.unstubAllGlobals();
});

describe("remote graph restore", () => {
  it("restores complete version 2 nodes into IndexedDB", async () => {
    const graph = {
      version: 2,
      nodes: [
        {
          id: "remote-1",
          title: "Redis Streams",
          slug: "redis-streams",
          summary: "Append-only stream data type.",
          notes: "Consumer groups distribute work.",
          keywords: ["streams"],
          tags: ["backend"],
          sections: ["Database"],
          resources: [
            {
              url: "https://redis.io/docs/latest/develop/data-types/streams/",
              title: "Redis Streams",
              type: "documentation",
              website: "redis.io",
            },
          ],
          relations: [],
          archived: false,
          favorite: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(graph), { status: 200 })),
    );

    const result = await restoreRemoteGraph(settings);

    expect(result).toEqual({ restored: 1, found: true });
    expect(await database.nodes.get("remote-1")).toMatchObject({
      notes: "Consumer groups distribute work.",
      resources: [
        expect.objectContaining({
          url: "https://redis.io/docs/latest/develop/data-types/streams/",
        }),
      ],
    });
  });

  it("recovers resource links from legacy node Markdown", async () => {
    const graph = {
      version: 1,
      nodes: [
        {
          id: "remote-legacy",
          title: "CAP Theorem",
          slug: "cap-theorem",
          sections: ["HLD"],
          tags: ["interview"],
          relations: [],
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    };
    const markdown = `# CAP Theorem

## Summary

Distributed systems trade-offs.

## Notes

Partition tolerance is required.

## Resources

- [CAP reference](https://example.com/cap) _(article)_

## Relationships

_No relationships yet._
`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) =>
        String(input).endsWith("graph.json?ref=main")
          ? new Response(JSON.stringify(graph), { status: 200 })
          : new Response(markdown, { status: 200 }),
      ),
    );

    await restoreRemoteGraph(settings);

    expect(await database.nodes.get("remote-legacy")).toMatchObject({
      summary: "Distributed systems trade-offs.",
      notes: "Partition tolerance is required.",
      resources: [
        {
          title: "CAP reference",
          url: "https://example.com/cap",
          type: "article",
          website: "example.com",
        },
      ],
    });
  });
});
