import type { PendingCapture } from "@/domain/knowledge-node/model";

const DEVELOPMENT_CAPTURE: PendingCapture = {
  title: "Designing data-intensive applications",
  url: "https://example.com/learning",
};

export async function getCurrentPage(): Promise<PendingCapture> {
  if (typeof chrome === "undefined" || !chrome.tabs) {
    return DEVELOPMENT_CAPTURE;
  }

  const pending = await chrome.storage.local.get("pendingCapture");
  if (pending.pendingCapture) {
    await chrome.storage.local.remove("pendingCapture");
    return pending.pendingCapture as PendingCapture;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return { title: tab?.title ?? "", url: tab?.url ?? "" };
}
