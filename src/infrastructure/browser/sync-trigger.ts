export function requestBackgroundSync() {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
  void chrome.runtime.sendMessage({ type: "SYNC_NOW" }).catch(() => undefined);
}
