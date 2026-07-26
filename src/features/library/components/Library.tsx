import { useMemo, useState } from "react";
import type { KnowledgeNode } from "@/domain/knowledge-node/model";
import { Plus, Search, X } from "@/shared/ui/icons";
import { searchNodes } from "../model/search-nodes";
import { EmptyState } from "./EmptyState";
import { NodeCard } from "./NodeCard";

interface LibraryProps {
  nodes: KnowledgeNode[];
  onEdit: (node: KnowledgeNode) => void;
  onCapture: () => void;
}

export function Library({ nodes, onEdit, onCapture }: LibraryProps) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All");
  const sections = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(nodes.flatMap((node) => node.sections)),
      ).sort(),
    ],
    [nodes],
  );
  const visible = useMemo(
    () =>
      searchNodes(nodes, query).filter(
        (node) =>
          !node.archived &&
          (section === "All" || node.sections.includes(section)),
      ),
    [nodes, query, section],
  );

  if (!nodes.length) return <EmptyState onCapture={onCapture} />;

  return (
    <section className="library">
      <div className="library-title">
        <div>
          <span className="eyebrow">Your second brain</span>
          <h1>Knowledge library</h1>
        </div>
        <button className="primary compact" onClick={onCapture}>
          <Plus /> Capture
        </button>
      </div>
      <div className="search-box">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ideas, tags, URLs…"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search">
            <X />
          </button>
        )}
      </div>
      <div className="filters">
        {sections.slice(0, 6).map((item) => (
          <button
            className={section === item ? "active" : ""}
            onClick={() => setSection(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="result-note">
        {visible.length} {visible.length === 1 ? "node" : "nodes"} · sorted by
        recent
      </div>
      <div className="node-list">
        {visible.map((node) => (
          <NodeCard key={node.id} node={node} onEdit={onEdit} />
        ))}
        {!visible.length && (
          <div className="no-results">
            <Search />
            <strong>No matching threads</strong>
            <span>Try a wider phrase or another section.</span>
          </div>
        )}
      </div>
    </section>
  );
}
