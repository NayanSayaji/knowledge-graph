import type { SyncJob, SyncOperation } from "@/domain/sync/model";
import { database } from "./database";

const STALE_CLAIM_MS = 5 * 60 * 1000;

function createJob(
  operation: SyncOperation,
  options: Pick<SyncJob, "nodeId" | "path"> = {},
): SyncJob {
  return {
    operation,
    ...options,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
}

export function enqueueNodeUpsert(nodeId: string) {
  return database.syncJobs.add(createJob("upsert", { nodeId }));
}

export function enqueueNodeDelete(path: string) {
  return database.syncJobs.add(createJob("delete", { path }));
}

export function enqueueFullSync() {
  return database.syncJobs.add(createJob("refresh"));
}

export async function claimPendingJobs(): Promise<SyncJob[]> {
  return database.transaction("rw", database.syncJobs, async () => {
    const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString();
    const stale = await database.syncJobs
      .where("status")
      .equals("in_progress")
      .filter((job) => !job.claimedAt || job.claimedAt < staleBefore)
      .toArray();

    if (stale.length) {
      await Promise.all(
        stale.map((job) =>
          database.syncJobs.update(job.id!, {
            status: "pending",
            claimedAt: undefined,
          }),
        ),
      );
    }

    const pending = await database.syncJobs
      .where("status")
      .equals("pending")
      .sortBy("createdAt");
    if (!pending.length) return [];

    const claimedAt = new Date().toISOString();
    await Promise.all(
      pending.map((job) =>
        database.syncJobs.update(job.id!, {
          status: "in_progress",
          claimedAt,
        }),
      ),
    );

    return pending.map((job) => ({
      ...job,
      status: "in_progress",
      claimedAt,
    }));
  });
}

export async function completeJobs(jobs: SyncJob[]) {
  await database.syncJobs.bulkDelete(jobs.map((job) => job.id!));
}

export async function releaseJobs(jobs: SyncJob[], error: unknown) {
  const lastError =
    error instanceof Error ? error.message.slice(0, 500) : "Unknown sync error";
  await database.transaction("rw", database.syncJobs, async () => {
    await Promise.all(
      jobs.map((job) =>
        database.syncJobs.update(job.id!, {
          status: "pending",
          attempts: job.attempts + 1,
          lastError,
          claimedAt: undefined,
        }),
      ),
    );
  });
}
