import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type {
  KnowledgeNode,
  PendingCapture,
} from "@/domain/knowledge-node/model";
import { CaptureForm } from "@/features/capture/components/CaptureForm";
import { Library } from "@/features/library/components/Library";
import { Settings } from "@/features/settings/components/Settings";
import { restoreRemoteGraphIfLocalEmpty } from "@/features/sync/services/sync-service";
import { getCurrentPage } from "@/infrastructure/browser/current-page";
import { database } from "@/infrastructure/storage/database";
import { Book, Network, Plus, Sliders } from "@/shared/ui/icons";

type View = "capture" | "library" | "settings";

export default function App() {
  const nodes =
    useLiveQuery(
      () => database.nodes.orderBy("updatedAt").reverse().toArray(),
      [],
    ) ?? [];
  const [view, setView] = useState<View>("capture");
  const [editing, setEditing] = useState<KnowledgeNode>();
  const [capture, setCapture] = useState<PendingCapture>();

  const loadCapture = useCallback(async () => {
    setCapture(await getCurrentPage());
  }, []);

  useEffect(() => {
    void loadCapture();
    void restoreRemoteGraphIfLocalEmpty().catch(() => undefined);
  }, [loadCapture]);

  function navigate(next: View) {
    setEditing(undefined);
    setView(next);
    if (next === "capture") void loadCapture();
  }

  return (
    <main className="app-shell">
      <header>
        <button className="brand" onClick={() => navigate("library")}>
          <span>
            <Network />
          </span>
          <strong>KnowlegeGraph</strong>
        </button>
        <div className="header-note">
          <span className="pulse" /> Offline ready
        </div>
      </header>
      <div className="content">
        {view === "capture" && (
          <CaptureForm
            key={editing?.id ?? capture?.url ?? "blank"}
            existing={editing}
            initialCapture={editing ? undefined : capture}
            onSaved={() => navigate("library")}
            onCancel={editing ? () => navigate("library") : undefined}
          />
        )}
        {view === "library" && (
          <Library
            nodes={nodes}
            onEdit={(node) => {
              setEditing(node);
              setView("capture");
            }}
            onCapture={() => navigate("capture")}
          />
        )}
        {view === "settings" && <Settings nodeCount={nodes.length} />}
      </div>
      <nav>
        <button
          className={view === "capture" ? "active" : ""}
          onClick={() => navigate("capture")}
        >
          <Plus />
          <span>Capture</span>
        </button>
        <button
          className={view === "library" ? "active" : ""}
          onClick={() => navigate("library")}
        >
          <Book />
          <span>Library</span>
          {nodes.length > 0 && (
            <b>{nodes.filter((node) => !node.archived).length}</b>
          )}
        </button>
        <button
          className={view === "settings" ? "active" : ""}
          onClick={() => navigate("settings")}
        >
          <Sliders />
          <span>Settings</span>
        </button>
      </nav>
    </main>
  );
}
