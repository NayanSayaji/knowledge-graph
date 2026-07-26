import {
  DEFAULT_GITHUB_SETTINGS,
  type GitHubSyncSettings,
} from "@/domain/sync/model";

const SETTINGS_KEY = "githubSyncSettings";

function hasExtensionStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function getGitHubSettings(): Promise<GitHubSyncSettings> {
  if (hasExtensionStorage()) {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    return {
      ...DEFAULT_GITHUB_SETTINGS,
      ...(stored[SETTINGS_KEY] as Partial<GitHubSyncSettings> | undefined),
    };
  }

  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw
    ? { ...DEFAULT_GITHUB_SETTINGS, ...JSON.parse(raw) }
    : DEFAULT_GITHUB_SETTINGS;
}

export async function saveGitHubSettings(settings: GitHubSyncSettings) {
  if (hasExtensionStorage()) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    return;
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function withoutGitHubToken(
  settings: GitHubSyncSettings,
): GitHubSyncSettings {
  return {
    ...settings,
    enabled: false,
    token: "",
  };
}
