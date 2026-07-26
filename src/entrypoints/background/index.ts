import { syncPendingJobs } from "@/features/sync/services/sync-service";

const SYNC_ALARM = "knowlegegraph-sync";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "knowlegegraph-save",
    title: "Save to KnowlegeGraph",
    contexts: ["page", "selection", "link"],
  });
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 1 });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const capture = {
    title: tab?.title ?? "Untitled",
    url: info.linkUrl ?? tab?.url ?? "",
    selectedText: info.selectionText ?? "",
  };
  await chrome.storage.local.set({ pendingCapture: capture });
  if (chrome.action.openPopup) {
    await chrome.action.openPopup().catch(() => undefined);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) {
    void syncPendingJobs().catch(() => undefined);
  }
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (
    typeof message !== "object" ||
    message === null ||
    !("type" in message) ||
    message.type !== "SYNC_NOW"
  ) {
    return false;
  }

  void syncPendingJobs()
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error: unknown) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }),
    );
  return true;
});
