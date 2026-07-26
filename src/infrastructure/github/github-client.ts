import type { GitHubSyncSettings } from "@/domain/sync/model";

const API_ROOT = "https://api.github.com";
const API_VERSION = "2026-03-10";

interface GitReference {
  object: { sha: string };
}

interface GitCommit {
  sha: string;
  tree: { sha: string };
}

interface GitTree {
  sha: string;
  tree: Array<{ path: string; sha: string; type: string }>;
}

interface GitBlob {
  sha: string;
}

interface TreeChange {
  path: string;
  content?: string;
  delete?: boolean;
}

function encodeReference(reference: string) {
  return reference.split("/").map(encodeURIComponent).join("/");
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export class GitHubClient {
  constructor(private readonly settings: GitHubSyncSettings) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.settings.token}`,
        "X-GitHub-Api-Version": API_VERSION,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      const detail = body?.message ?? response.statusText;
      if (response.status === 409) {
        throw new Error(
          "GitHub repository is empty or unavailable. Create an initial commit first.",
        );
      }
      throw new Error(`GitHub ${response.status}: ${detail}`);
    }

    return (await response.json()) as T;
  }

  private repositoryPath(path: string) {
    const owner = encodeURIComponent(this.settings.owner);
    const repository = encodeURIComponent(this.settings.repository);
    return `/repos/${owner}/${repository}${path}`;
  }

  async verifyConnection() {
    await this.getHead();
  }

  async commitChanges(changes: TreeChange[], message: string) {
    const head = await this.getHead();
    const parent = await this.request<GitCommit>(
      this.repositoryPath(`/git/commits/${head}`),
    );
    const baseTree = await this.request<GitTree>(
      this.repositoryPath(`/git/trees/${parent.tree.sha}?recursive=1`),
    );
    const existingPaths = new Set(baseTree.tree.map((item) => item.path));

    const tree = await Promise.all(
      changes
        .filter((change) => !change.delete || existingPaths.has(change.path))
        .map(async (change) => {
          if (change.delete) {
            return {
              path: change.path,
              mode: "100644",
              type: "blob",
              sha: null,
            };
          }

          const blob = await this.request<GitBlob>(
            this.repositoryPath("/git/blobs"),
            {
              method: "POST",
              body: JSON.stringify({
                content: encodeBase64(change.content ?? ""),
                encoding: "base64",
              }),
            },
          );
          return {
            path: change.path,
            mode: "100644",
            type: "blob",
            sha: blob.sha,
          };
        }),
    );

    if (!tree.length) return head;

    const createdTree = await this.request<GitTree>(
      this.repositoryPath("/git/trees"),
      {
        method: "POST",
        body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
      },
    );
    const commit = await this.request<GitCommit>(
      this.repositoryPath("/git/commits"),
      {
        method: "POST",
        body: JSON.stringify({
          message,
          tree: createdTree.sha,
          parents: [head],
        }),
      },
    );
    await this.request<GitReference>(
      this.repositoryPath(
        `/git/refs/heads/${encodeReference(this.settings.branch)}`,
      ),
      {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      },
    );

    return commit.sha;
  }

  private async getHead() {
    const reference = await this.request<GitReference>(
      this.repositoryPath(
        `/git/ref/heads/${encodeReference(this.settings.branch)}`,
      ),
    );
    return reference.object.sha;
  }
}
