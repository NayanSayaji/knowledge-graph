import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { z } from "zod";
import {
  DEFAULT_GITHUB_SETTINGS,
  type GitHubSyncSettings,
} from "@/domain/sync/model";
import {
  restoreRemoteGraph,
  syncPendingJobs,
} from "@/features/sync/services/sync-service";
import { GitHubClient } from "@/infrastructure/github/github-client";
import {
  getGitHubSettings,
  saveGitHubSettings,
} from "@/infrastructure/github/settings";
import { database } from "@/infrastructure/storage/database";
import { enqueueFullSync } from "@/infrastructure/storage/sync-queue";
import { External, Network } from "@/shared/ui/icons";

const TOKEN_CREATION_URL =
  "https://github.com/settings/personal-access-tokens/new" +
  "?name=KnowlegeGraph" +
  "&description=Create+and+sync+the+KnowlegeGraph+knowledge+repository" +
  "&administration=write" +
  "&contents=write";
const TOKEN_HELP_URL =
  "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens";

const createSchema = z.object({
  repositoryName: z
    .string()
    .trim()
    .min(1, "Repository name is required.")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Use letters, numbers, dots, hyphens, or underscores.",
    ),
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
  token: z.string().trim().min(1, "Add a fine-grained access token first."),
});

const existingSchema = createSchema
  .omit({ repositoryName: true })
  .extend({
    owner: z.string().trim().min(1, "Repository owner is required."),
    repository: z.string().trim().min(1, "Repository name is required."),
    branch: z.string().trim().min(1, "Branch is required."),
  });

export function GitHubSyncPanel() {
  const [settings, setSettings] = useState<GitHubSyncSettings>(
    DEFAULT_GITHUB_SETTINGS,
  );
  const [repositoryName, setRepositoryName] = useState("knowlege-base");
  const [privateRepository, setPrivateRepository] = useState(true);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const pendingCount =
    useLiveQuery(() =>
      database.syncJobs.where("status").equals("pending").count(),
    ) ?? 0;
  const lastFailed = useLiveQuery(() =>
    database.syncJobs
      .where("status")
      .equals("pending")
      .filter((job) => Boolean(job.lastError))
      .last(),
  );
  const connected = Boolean(settings.owner && settings.repository);

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

  function reportError(error: unknown) {
    setNotice(error instanceof Error ? error.message : "GitHub setup failed.");
  }

  async function createRepositoryAndSync() {
    const result = createSchema.safeParse({
      repositoryName,
      directory: settings.directory,
      token: settings.token,
    });
    if (!result.success) {
      setNotice(result.error.issues[0].message);
      return;
    }

    setWorking(true);
    setNotice("Finding an available repository name…");
    try {
      const provision =
        await new GitHubClient(settings).createAvailableRepository(
          result.data.repositoryName,
          privateRepository,
        );
      const repository = provision.repository;
      const connectedSettings: GitHubSyncSettings = {
        ...settings,
        enabled: true,
        owner: repository.owner.login,
        repository: repository.name,
        branch: repository.default_branch,
        directory: result.data.directory,
        token: result.data.token,
      };
      await saveGitHubSettings(connectedSettings);
      setSettings(connectedSettings);
      const restore = provision.created
        ? { restored: 0, found: false }
        : await restoreRemoteGraph(connectedSettings);
      await enqueueFullSync();
      const sync = await syncPendingJobs({ ignoreDisabled: true });
      setNotice(
        `${provision.created ? "Created" : "Reused"} ${repository.full_name}, restored ${restore.restored} nodes, and synced ${sync.synced} queued changes.`,
      );
    } catch (error) {
      reportError(error);
    } finally {
      setWorking(false);
    }
  }

  async function saveExisting() {
    const result = existingSchema.safeParse(settings);
    if (!result.success) {
      setNotice(result.error.issues[0].message);
      return;
    }

    setWorking(true);
    setNotice("");
    try {
      await new GitHubClient(settings).verifyConnection();
      await saveGitHubSettings(settings);
      const restore = await restoreRemoteGraph(settings);
      await enqueueFullSync();
      const sync = await syncPendingJobs({ ignoreDisabled: true });
      setNotice(
        sync.commit
          ? `Restored ${restore.restored} nodes and synced. Commit ${sync.commit.slice(0, 7)}.`
          : `Connected and restored ${restore.restored} nodes.`,
      );
    } catch (error) {
      reportError(error);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-card github-card">Loading GitHub settings…</div>
    );
  }

  return (
    <div className="settings-card github-card">
      <div className="github-heading">
        <div className="setting-icon">
          <Network />
        </div>
        <div>
          <strong>GitHub backup</strong>
          <p>Create a repository and keep it synced automatically.</p>
        </div>
        <span className={settings.enabled && connected ? "status" : "soon"}>
          {settings.enabled && connected ? "Connected" : "Setup"}
        </span>
      </div>

      {connected && (
        <a
          className="connected-repo"
          href={`https://github.com/${settings.owner}/${settings.repository}`}
          target="_blank"
          rel="noreferrer"
        >
          <span>
            Connected to <strong>{settings.owner}/{settings.repository}</strong>
          </span>
          <External />
        </a>
      )}

      <div className="setup-step">
        <span className="step-number">1</span>
        <div>
          <strong>Add a fine-grained token</strong>
          <p>
            Select <b>All repositories</b>, then allow Administration and
            Contents read/write.
          </p>
        </div>
      </div>
      <label>
        <span>
          Fine-grained token
          <a href={TOKEN_HELP_URL} target="_blank" rel="noreferrer">
            What is this? <External />
          </a>
        </span>
        <div className="token-field">
          <input
            type="password"
            autoComplete="off"
            value={settings.token}
            onChange={(event) => update("token", event.target.value)}
            placeholder="github_pat_…"
          />
          <a
            className="secondary create-token"
            href={TOKEN_CREATION_URL}
            target="_blank"
            rel="noreferrer"
          >
            Create token <External />
          </a>
        </div>
      </label>

      <div className="setup-step">
        <span className="step-number">2</span>
        <div>
          <strong>Create your knowledge repository</strong>
          <p>
            Matching KnowlegeGraph repositories are reused; other name conflicts
            get `_1`, `_2`, and later suffixes.
          </p>
        </div>
      </div>
      <div className="github-grid">
        <label>
          <span>Repository name</span>
          <input
            value={repositoryName}
            onChange={(event) => setRepositoryName(event.target.value)}
            placeholder="knowlege-base"
          />
        </label>
        <label>
          <span>Knowledge directory</span>
          <input
            value={settings.directory}
            onChange={(event) => update("directory", event.target.value)}
            placeholder="knowledge"
          />
        </label>
      </div>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={privateRepository}
          onChange={(event) => setPrivateRepository(event.target.checked)}
        />
        <span>Create as a private repository</span>
      </label>
      <button
        className="primary create-repository"
        disabled={working || !settings.token.trim()}
        onClick={createRepositoryAndSync}
      >
        {working ? "Setting up…" : "Create repository & sync"}
        <ArrowIcon />
      </button>

      <details className="existing-repository">
        <summary>Or connect an existing repository</summary>
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
              placeholder="knowlege-base"
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
          <label className="toggle-row compact-toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => update("enabled", event.target.checked)}
            />
            <span>Background sync</span>
          </label>
        </div>
        <button className="secondary" disabled={working} onClick={saveExisting}>
          Verify existing repository & sync
        </button>
      </details>

      <div className="sync-summary">
        <span>{pendingCount} queued</span>
        {lastFailed?.lastError && (
          <span className="sync-error" title={lastFailed.lastError}>
            Last attempt failed
          </span>
        )}
      </div>
      {notice && <div className="toast">{notice}</div>}
      <p className="security-note">
        Your token stays in extension-local storage and is never written to the
        repository or JSON exports.
      </p>
    </div>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true">→</span>;
}
