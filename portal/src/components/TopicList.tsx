import type { KnowledgeNode } from "../types";
import { formatDate } from "../lib/portal-data";

export function TopicList({ nodes }: { nodes: KnowledgeNode[] }) {
  if (!nodes.length) return <div className="empty-panel">No topics match this view yet.</div>;

  return (
    <div className="topic-list">
      {nodes.map((node, index) => (
        <a href={`#/topic/${node.slug}`} key={node.id}>
          <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
          <div className="topic-copy">
            <span className="topic-meta">
              {node.sections[0] ?? "Unsorted"} · <time dateTime={node.updatedAt}>{formatDate(node.updatedAt)}</time>
            </span>
            <strong>{node.title}</strong>
            <p>{node.summary || "Notes are waiting to be expanded."}</p>
            <span className="topic-tags">{node.tags.slice(0, 3).join(" · ")}</span>
          </div>
          <span className="topic-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}
