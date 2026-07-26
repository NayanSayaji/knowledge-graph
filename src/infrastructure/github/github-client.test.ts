import { afterEach, describe, expect, it, vi } from "vitest";
import type { GitHubSyncSettings } from "@/domain/sync/model";
import { GitHubClient } from "./github-client";

const settings: GitHubSyncSettings = {
  enabled: true,
  owner: "octocat",
  repository: "knowledge",
  branch: "main",
  directory: "knowledge",
  token: "test-token",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GitHub client", () => {
  it("creates blobs, a tree, a commit, and fast-forwards the branch", async () => {
    let blobIndex = 0;
    const requests: Array<{ url: string; method: string; body?: string }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        requests.push({ url, method, body: init?.body as string | undefined });

        if (url.includes("/git/ref/heads/main")) {
          return response({ object: { sha: "head-sha" } });
        }
        if (url.endsWith("/git/commits/head-sha")) {
          return response({ sha: "head-sha", tree: { sha: "base-tree" } });
        }
        if (url.includes("/git/trees/base-tree?recursive=1")) {
          return response({
            sha: "base-tree",
            tree: [{ path: "knowledge/old.md", sha: "old", type: "blob" }],
          });
        }
        if (url.endsWith("/git/blobs")) {
          blobIndex += 1;
          return response({ sha: `blob-${blobIndex}` }, 201);
        }
        if (url.endsWith("/git/trees")) {
          return response({ sha: "new-tree", tree: [] }, 201);
        }
        if (url.endsWith("/git/commits")) {
          return response({ sha: "new-commit", tree: { sha: "new-tree" } }, 201);
        }
        if (url.includes("/git/refs/heads/main")) {
          return response({ object: { sha: "new-commit" } });
        }
        throw new Error(`Unexpected request: ${method} ${url}`);
      }),
    );

    const commit = await new GitHubClient(settings).commitChanges(
      [
        { path: "knowledge/new.md", content: "# New" },
        { path: "knowledge/old.md", delete: true },
      ],
      "Sync changes",
    );

    expect(commit).toBe("new-commit");
    expect(requests.map(({ method }) => method)).toEqual([
      "GET",
      "GET",
      "GET",
      "POST",
      "POST",
      "POST",
      "PATCH",
    ]);
    const update = requests.at(-1)!;
    expect(JSON.parse(update.body!)).toEqual({
      sha: "new-commit",
      force: false,
    });
  });

  it("explains the initial-commit requirement", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ message: "Git Repository is empty." }, 409)),
    );

    await expect(new GitHubClient(settings).verifyConnection()).rejects.toThrow(
      "Create an initial commit first",
    );
  });
});
