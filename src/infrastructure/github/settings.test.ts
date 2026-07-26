import { describe, expect, it } from "vitest";
import type { GitHubSyncSettings } from "@/domain/sync/model";
import { withoutGitHubToken } from "./settings";

describe("GitHub settings", () => {
  it("clears the token and pauses sync without losing repository details", () => {
    const settings: GitHubSyncSettings = {
      enabled: true,
      owner: "octocat",
      repository: "knowlege-base",
      branch: "main",
      directory: "knowledge",
      token: "github_pat_secret",
    };

    expect(withoutGitHubToken(settings)).toEqual({
      ...settings,
      enabled: false,
      token: "",
    });
  });
});
