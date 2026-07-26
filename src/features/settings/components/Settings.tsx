import { useRef, useState } from "react";
import {
  exportGraph,
  importGraph,
} from "@/infrastructure/storage/graph-transfer";
import { GitHubSyncPanel } from "@/features/sync/components/GitHubSyncPanel";
import { Book } from "@/shared/ui/icons";

interface SettingsProps {
  nodeCount: number;
}

export function Settings({ nodeCount }: SettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");

  async function download() {
    const content = await exportGraph();
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `knowlegegraph-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Export created.");
  }

  async function upload(file?: File) {
    if (!file) return;
    try {
      await importGraph(await file.text());
      setNotice("Knowledge imported successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed.");
    }
  }

  return (
    <section className="settings">
      <span className="eyebrow">Portable by design</span>
      <h1>Settings</h1>
      <div className="settings-card">
        <div className="setting-icon">
          <Book />
        </div>
        <div>
          <strong>Your local graph</strong>
          <p>{nodeCount} nodes stored on this device. Export a backup anytime.</p>
        </div>
        <span className="status">Offline</span>
      </div>
      <div className="settings-card action-card">
        <div>
          <strong>Data & portability</strong>
          <p>Move your graph between browsers with a JSON file.</p>
        </div>
        <div className="button-row">
          <button className="secondary" onClick={download}>
            Export JSON
          </button>
          <button
            className="secondary"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            accept=".json"
            onChange={(event) => upload(event.target.files?.[0])}
          />
        </div>
      </div>
      <GitHubSyncPanel />
      {notice && <div className="toast">{notice}</div>}
      <p className="version">
        KnowlegeGraph 0.3.0 · Your knowledge belongs to you.
      </p>
    </section>
  );
}
