import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { z } from "zod";
import {
  DEFAULT_GITHUB_SETTINGS,
  type GitHubSyncSettings,
} from "@/domain/sync/model";
import { syncPendingJobs } from "@/features/sync/services/sync-service";
import { GitHubClient } from "@/infrastructure/github/github-client";
import {
  getGitHubSettings,
  saveGitHubSettings,
} from "@/infrastructure/github/settings";
import { database } from "@/infrastructure/storage/database";
import { enqueueFullSync } from "@/infrastructure/storage/sync-queue";
import { Network } from "@/shared/ui/icons";

const settingsSchema = z.object({
  owner: z.string().trim().min(1, "Repository owner is required."),
  repository: z.string().trim().min(1, "Repository name is required."),
  branch: z.string().trim().min(1, "Branch is required."),
  directory: z
    .string()
    .trim()
    .min(1, "Directory is required.")
    .refine(
      (value) =>
        !value.startsWith("/") &&
        !value.endsWith("/") &&
        !value.split("/").includes(".."),
      "Use a relative repository directory without '..'.",
    ),
  token: z.string().trim().min(1, "A fine-grained access token is required."),
});

export function GitHubSyncPanel() {
  const [settings, setSettings] = useState<GitHubSyncSettings>(
    DEFAULT_GITHUB_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const pendingCount =
    useLiveQuery(() => database.syncJobs.where("status").equals("pending").count()) ??
    0;
  const lastFailed = useLiveQuery(() =>
    database.syncJobs
      .where("status")
      .equals("pending")
      .filter((job) => Boolean(job.lastError))
      .last(),
  );

  useEffect(() => {
    void getGitHubSettings().then((stored) => {
      setSettings(stored);
      setLoading(false);
    });
  }, []);

  function update<K extends keyof GitHubSyncSettings>(
    key: K,
    value: GitHubSyncSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const result = settingsSchema.safeParse(settings);
    if (!result.success) {
      setNotice(result.error.issues[0].message);
      return false;
    }
    return true;
  }

  async function save() {
    if (!validate()) return;
    setWorking(true);
    setNotice("");
    try {
      await saveGitHubSettings(settings);
      setNotice("GitHub settings saved locally.");
    } finally {
      setWorking(false);
    }
  }

  async function verifyAndSync() {
    if (!validate()) return;
    setWorking(true);
    setNotice("");
    try {
      const enabledSettings = { ...settings, enabled: true };
      await new GitHubClient(enabledSettings).verifyConnection();
      await saveGitHubSettings(enabledSettings);
      setSettings(enabledSettings);
      await enqueueFullSync();
      const result = await syncPendingJobs({ ignoreDisabled: true });
      setNotice(
        result.commit
          ? `Synced ${result.synced} queued changes. Commit ${result.commit.slice(0, 7)}.`
          : "Connection verified. Nothing was waiting to sync.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "GitHub sync failed.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <div className="settings-card github-card">Loading GitHub settings…</div>;
  }

  return (
    <div className="settings-card github-card">
      <div className="github-heading">
        <div className="setting-icon">
          <Network />
        </div>
        <div>
          <strong>GitHub sync</strong>
          <p>Commit Markdown, graph metadata, and an index to your repository.</p>
        </div>
        <span className={settings.enabled ? "status" : "soon"}>
          {settings.enabled ? "Enabled" : "Paused"}
        </span>
      </div>

      <div className="github-grid">
        <label>
          <span>Owner</span>
          <input
            value={settings.owner}
            onChange={(event) => update("owner", event.target.value)}
            placeholder="octocat"
          />
        </label>
        <label>
          <span>Repository</span>
          <input
            value={settings.repository}
            onChange={(event) => update("repository", event.target.value)}
            placeholder="knowledge"
          />
        </label>
        <label>
          <span>Branch</span>
          <input
            value={settings.branch}
            onChange={(event) => update("branch", event.target.value)}
            placeholder="main"
          />
        </label>
        <label>
          <span>Directory</span>
          <input
            value={settings.directory}
            onChange={(event) => update("directory", event.target.value)}
            placeholder="knowledge"
          />
        </label>
      </div>
      <label>
        <span>
          Fine-grained token <em>Contents: read and write</em>
        </span>
        <input
          type="password"
          autoComplete="off"
          value={settings.token}
          onChange={(event) => update("token", event.target.value)}
          placeholder="github_pat_…"
        />
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => update("enabled", event.target.checked)}
        />
        <span>Retry queued changes automatically in the background</span>
      </label>

      <div className="sync-summary">
        <span>{pendingCount} queued</span>
        {lastFailed?.lastError && (
          <span className="sync-error" title={lastFailed.lastError}>
            Last attempt failed
          </span>
        )}
      </div>
      <div className="button-row">
        <button className="secondary" disabled={working} onClick={save}>
          Save settings
        </button>
        <button className="primary compact" disabled={working} onClick={verifyAndSync}>
          {working ? "Working…" : "Verify & sync now"}
        </button>
      </div>
      {notice && <div className="toast">{notice}</div>}
      <p className="security-note">
        The token stays in extension-local storage and is never included in
        exports or repository files.
      </p>
    </div>
  );
}
