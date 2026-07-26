import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { database } from "./database";
import {
  claimPendingJobs,
  completeJobs,
  enqueueFullSync,
  enqueueNodeUpsert,
  releaseJobs,
} from "./sync-queue";

afterEach(async () => {
  await database.syncJobs.clear();
});

describe("sync queue", () => {
  it("claims pending work once", async () => {
    await enqueueNodeUpsert("node-1");
    const claimed = await claimPendingJobs();
    expect(claimed).toHaveLength(1);
    expect(claimed[0]).toMatchObject({
      nodeId: "node-1",
      status: "in_progress",
    });
    expect(await claimPendingJobs()).toHaveLength(0);
  });

  it("releases failed jobs for retry", async () => {
    await enqueueFullSync();
    const claimed = await claimPendingJobs();
    await releaseJobs(claimed, new Error("Network unavailable"));
    const stored = await database.syncJobs.get(claimed[0].id!);
    expect(stored).toMatchObject({
      status: "pending",
      attempts: 1,
      lastError: "Network unavailable",
    });
  });

  it("removes completed work", async () => {
    await enqueueFullSync();
    const claimed = await claimPendingJobs();
    await completeJobs(claimed);
    expect(await database.syncJobs.count()).toBe(0);
  });
});
