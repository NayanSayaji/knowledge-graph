import { useState } from "react";
import type { KnowledgeNode } from "../../types";

export function GraphPage({ nodes }: { nodes: KnowledgeNode[] }) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(1);
  const visible = nodes.filter((node) => node.title.toLowerCase().includes(query.toLowerCase()));
  const positions = new Map(
    nodes.map((node, index) => [
      node.id,
      { x: 420 + Math.cos(index * 2.4) * (170 + index * 8), y: 300 + Math.sin(index * 2.4) * (170 + index * 8) },
    ]),
  );

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Connections</p>
        <h1 className="page-title">Knowledge graph</h1>
        <p className="lede">Follow the relationships between ideas in the collection.</p>
      </div>
      <div className="graph-toolbar">
        <input
          aria-label="Highlight a graph node"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Highlight a node…"
        />
        <button type="button" aria-label="Zoom out" onClick={() => setScale(Math.max(0.6, scale - 0.2))}>
          −
        </button>
        <span aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => setScale(Math.min(1.8, scale + 0.2))}>
          +
        </button>
      </div>
      <div className="graph-canvas">
        <svg viewBox="0 0 840 600" style={{ transform: `scale(${scale})` }}>
          {nodes.flatMap((node) =>
            node.relations.map((relation) => {
              const from = positions.get(node.id);
              const to = positions.get(relation.targetId);
              return from && to ? (
                <line key={`${node.id}-${relation.targetId}-${relation.type}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              ) : null;
            }),
          )}
          {nodes.map((node) => {
            const point = positions.get(node.id)!;
            const highlighted = !query || visible.includes(node);
            const openNode = () => {
              location.hash = `/topic/${node.slug}`;
            };

            return (
              <g
                className={highlighted ? "graph-node" : "graph-node dim"}
                key={node.id}
                role="link"
                tabIndex={0}
                aria-label={`Open ${node.title}`}
                onClick={openNode}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openNode();
                  }
                }}
              >
                <circle cx={point.x} cy={point.y} r={node.favorite ? 28 : 22} />
                <text x={point.x} y={point.y + 4}>
                  {node.title.slice(0, 18)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}
