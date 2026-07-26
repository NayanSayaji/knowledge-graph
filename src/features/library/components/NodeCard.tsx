import { useState } from "react";
import type { KnowledgeNode } from "@/domain/knowledge-node/model";
import {
  archiveNode,
  deleteNode,
  setFavorite,
} from "@/infrastructure/storage/node-repository";
import { getDomain } from "@/shared/lib/url";
import { More, Network, Star } from "@/shared/ui/icons";

interface NodeCardProps {
  node: KnowledgeNode;
  onEdit: (node: KnowledgeNode) => void;
}

export function NodeCard({ node, onEdit }: NodeCardProps) {
  const [menu, setMenu] = useState(false);
  const source = node.resources[0];

  return (
    <article className="node-card" onClick={() => onEdit(node)}>
      <div className="node-top">
        <div className="node-symbol">
          <Network />
        </div>
        <div className="node-copy">
          <h3>{node.title}</h3>
          <p>
            {node.summary ||
              node.notes ||
              "A knowledge node waiting for your notes."}
          </p>
        </div>
        <button
          className="icon-button tiny"
          onClick={(event) => {
            event.stopPropagation();
            setMenu(!menu);
          }}
          aria-label="Node actions"
        >
          <More />
        </button>
        {menu && (
          <div className="card-menu" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setFavorite(node.id, !node.favorite)}>
              {node.favorite ? "Remove favorite" : "Add favorite"}
            </button>
            <button onClick={() => archiveNode(node.id)}>Archive</button>
            <button className="danger" onClick={() => deleteNode(node.id)}>
              Delete
            </button>
          </div>
        )}
      </div>
      <div className="node-meta">
        {node.favorite && (
          <span className="favorite">
            <Star /> Favorite
          </span>
        )}
        {node.sections.slice(0, 2).map((section) => (
          <span key={section}>{section}</span>
        ))}
        {source && <span className="source">{getDomain(source.url)}</span>}
        <time>
          {new Date(node.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </time>
      </div>
    </article>
  );
}
