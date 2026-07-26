import { afterEach, describe, expect, it, vi } from "vitest";
import type { GitHubSyncSettings } from "@/domain/sync/model";
import {
  GENERATED_REPOSITORY_DESCRIPTION,
  GitHubClient,
} from "./github-client";

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
  it("rejects a private repository for the documentation portal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response({
          name: "knowledge",
          full_name: "octocat/knowledge",
          private: true,
          default_branch: "main",
          owner: { login: "octocat" },
        }),
      ),
    );

    await expect(
      new GitHubClient(settings).verifyPublicRepository(),
    ).rejects.toThrow("requires a public repository");
  });

  it("enables GitHub Pages with the workflow build type", async () => {
    const requests: Array<{ method: string; body?: string }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        requests.push({ method, body: init?.body as string | undefined });
        if (method === "GET") {
          return response({ message: "Not Found" }, 404);
        }
        return response(
          {
            html_url: "https://octocat.github.io/knowledge/",
            build_type: "workflow",
          },
          201,
        );
      }),
    );

    const site = await new GitHubClient(settings).ensurePagesWorkflow();

    expect(site.build_type).toBe("workflow");
    expect(requests).toEqual([
      { method: "GET", body: undefined },
      {
        method: "POST",
        body: JSON.stringify({ build_type: "workflow" }),
      },
    ]);
  });

  it("explains the Pages permission required for automatic enablement", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response(
          { message: "Resource not accessible by personal access token" },
          403,
        ),
      ),
    );

    await expect(
      new GitHubClient(settings).ensurePagesWorkflow(),
    ).rejects.toThrow("Pages: Read and write");
  });

  it("reuses an existing repository created by KnowlegeGraph", async () => {
    const createRequest = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/user")) {
          return response({ login: "octocat" });
        }
        if (url.endsWith("/repos/octocat/knowlege-base")) {
          return response({
            name: "knowlege-base",
            full_name: "octocat/knowlege-base",
            html_url: "https://github.com/octocat/knowlege-base",
            private: true,
            default_branch: "main",
            description: GENERATED_REPOSITORY_DESCRIPTION,
            owner: { login: "octocat" },
          });
        }
        createRequest();
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const provision =
      await new GitHubClient(settings).createAvailableRepository(
        "knowlege-base",
        true,
      );

    expect(provision).toMatchObject({
      created: false,
      repository: { full_name: "octocat/knowlege-base" },
    });
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("appends a numeric suffix until a repository name is available", async () => {
    const createdBodies: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/user")) {
          return response({ login: "octocat" });
        }
        if (url.endsWith("/repos/octocat/knowlege-base")) {
          return response({ id: 1 });
        }
        if (url.endsWith("/repos/octocat/knowlege-base_1")) {
          return response({ id: 2 });
        }
        if (url.endsWith("/repos/octocat/knowlege-base_2")) {
          return response({ message: "Not Found" }, 404);
        }
        if (url.endsWith("/user/repos") && init?.method === "POST") {
          createdBodies.push(JSON.parse(init.body as string));
          return response(
            {
              name: "knowlege-base_2",
              full_name: "octocat/knowlege-base_2",
              html_url: "https://github.com/octocat/knowlege-base_2",
              private: true,
              default_branch: "main",
              owner: { login: "octocat" },
            },
            201,
          );
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const provision =
      await new GitHubClient(settings).createAvailableRepository(
        "knowlege-base",
        true,
      );

    expect(provision.repository.name).toBe("knowlege-base_2");
    expect(provision.created).toBe(true);
    expect(createdBodies).toEqual([
      expect.objectContaining({
        name: "knowlege-base_2",
        private: true,
        auto_init: true,
      }),
    ]);
  });

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

  it("explains the workflow permission required for portal sync", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/git/ref/heads/main")) {
          return response({ object: { sha: "head-sha" } });
        }
        if (url.endsWith("/git/commits/head-sha")) {
          return response({ sha: "head-sha", tree: { sha: "base-tree" } });
        }
        if (url.includes("/git/trees/base-tree?recursive=1")) {
          return response({ sha: "base-tree", tree: [] });
        }
        if (url.endsWith("/git/blobs")) {
          return response({ sha: "workflow-blob" }, 201);
        }
        if (url.endsWith("/git/trees")) {
          return response({ sha: "new-tree", tree: [] }, 201);
        }
        if (url.endsWith("/git/commits")) {
          return response(
            { sha: "new-commit", tree: { sha: "new-tree" } },
            201,
          );
        }
        if (
          url.includes("/git/refs/heads/main") &&
          init?.method === "PATCH"
        ) {
          return response(
            { message: "Resource not accessible by personal access token" },
            403,
          );
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    await expect(
      new GitHubClient(settings).commitChanges(
        [
          {
            path: ".github/workflows/deploy-knowledge-portal.yml",
            content: "name: Deploy",
          },
        ],
        "Sync portal",
      ),
    ).rejects.toThrow("Workflows: Read and write");
  });
});
