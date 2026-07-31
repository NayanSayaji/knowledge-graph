import { useCallback, useEffect, useState } from "react";
import { createHashRouter, Navigate, NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useLiveQuery } from "dexie-react-hooks";
import type { KnowledgeNode, PendingCapture } from "@/domain/knowledge-node/model";
import { CaptureForm } from "@/features/capture/components/CaptureForm";
import { Library } from "@/features/library/components/Library";
import { Settings } from "@/features/settings/components/Settings";
import { restoreRemoteGraphIfLocalEmpty } from "@/features/sync/services/sync-service";
import { getCurrentPage } from "@/infrastructure/browser/current-page";
import { database } from "@/infrastructure/storage/database";
import { Book, Network, Plus, Sliders } from "@/shared/ui/icons";

type ShellContext = {
  nodes: KnowledgeNode[];
  capture?: PendingCapture;
  editing?: KnowledgeNode;
  setEditing: (node?: KnowledgeNode) => void;
  reloadCapture: () => Promise<void>;
};

function ExtensionShell() {
  const nodes =
    useLiveQuery(
      () => database.nodes.orderBy("updatedAt").reverse().toArray(),
      [],
    ) ?? [];
  const [editing, setEditing] = useState<KnowledgeNode>();
  const [capture, setCapture] = useState<PendingCapture>();

  const reloadCapture = useCallback(async () => {
    setCapture(await getCurrentPage());
  }, []);

  useEffect(() => {
    void reloadCapture();
    void restoreRemoteGraphIfLocalEmpty().catch(() => undefined);
  }, [reloadCapture]);

  return (
    <main className="app-shell">
      <header>
        <NavLink className="brand" to="/library" onClick={() => setEditing(undefined)}>
          <span>
            <Network />
          </span>
          <strong>KnowlegeGraph</strong>
        </NavLink>
        <div className="header-note">
          <span className="pulse" /> Offline ready
        </div>
      </header>
      <div className="content">
        <Outlet
          context={{
            nodes,
            capture,
            editing,
            setEditing,
            reloadCapture,
          } satisfies ShellContext}
        />
      </div>
      <nav>
        <NavLink to="/capture" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setEditing(undefined)}>
          <Plus />
          <span>Capture</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setEditing(undefined)}>
          <Book />
          <span>Library</span>
          {nodes.length > 0 && <b>{nodes.filter((node) => !node.archived).length}</b>}
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setEditing(undefined)}>
          <Sliders />
          <span>Settings</span>
        </NavLink>
      </nav>
    </main>
  );
}

function CaptureRoute() {
  const navigate = useNavigate();
  const { editing, capture, reloadCapture } = useOutletContext<ShellContext>();

  return (
    <CaptureForm
      key={editing?.id ?? capture?.url ?? "blank"}
      existing={editing}
      initialCapture={editing ? undefined : capture}
      onSaved={() => {
        void reloadCapture();
        navigate("/library");
      }}
      onCancel={editing ? () => navigate("/library") : undefined}
    />
  );
}

function LibraryRoute() {
  const navigate = useNavigate();
  const { nodes, setEditing } = useOutletContext<ShellContext>();

  return (
    <Library
      nodes={nodes}
      onEdit={(node) => {
        setEditing(node);
        navigate("/capture");
      }}
      onCapture={() => navigate("/capture")}
    />
  );
}

function SettingsRoute() {
  const { nodes } = useOutletContext<ShellContext>();
  return <Settings nodeCount={nodes.length} />;
}

const router = createHashRouter([
  {
    path: "/",
    element: <ExtensionShell />,
    children: [
      { index: true, element: <Navigate to="/capture" replace /> },
      { path: "capture", element: <CaptureRoute /> },
      { path: "library", element: <LibraryRoute /> },
      { path: "settings", element: <SettingsRoute /> },
    ],
  },
]);

export function ExtensionRouter() {
  return <RouterProvider router={router} />;
}
