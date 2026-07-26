export type SyncOperation = "upsert" | "delete" | "refresh";
export type SyncJobStatus = "pending" | "in_progress";

export interface SyncJob {
  id?: number;
  operation: SyncOperation;
  nodeId?: string;
  path?: string;
  status: SyncJobStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  claimedAt?: string;
}

export interface GitHubSyncSettings {
  enabled: boolean;
  owner: string;
  repository: string;
  branch: string;
  directory: string;
  token: string;
}

export const DEFAULT_GITHUB_SETTINGS: GitHubSyncSettings = {
  enabled: false,
  owner: "",
  repository: "",
  branch: "main",
  directory: "knowledge",
  token: "",
};
