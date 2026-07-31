import { useEffect, useState } from "react";
import type { KnowledgeGraph, PortalStats, SectionIndex } from "../types";
import { buildSectionIndex, derivedStats, normalizeGraphSections } from "../lib/portal-data";
import { previewNodes } from "../data/previewNodes";
import { PortalRouter } from "./PortalRouter";

export function PortalApp() {
  const [graph, setGraph] = useState<KnowledgeGraph>();
  const [sections, setSections] = useState<SectionIndex["sections"]>([]);
  const [stats, setStats] = useState<PortalStats>();

  useEffect(() => {
    Promise.all([
      fetch("./knowledge/graph.json").then((response) => response.json() as Promise<KnowledgeGraph>),
    ])
      .then(([loadedGraph]) => {
        const normalizedGraph = {
          ...loadedGraph,
          nodes: normalizeGraphSections(loadedGraph.nodes),
        };
        setGraph(normalizedGraph);
        setSections(buildSectionIndex(normalizedGraph.nodes));
        setStats(derivedStats(normalizedGraph.nodes));
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          const fallbackGraph: KnowledgeGraph = {
            version: 1,
            generatedAt: new Date().toISOString(),
            nodes: normalizeGraphSections(previewNodes),
          };
          setGraph(fallbackGraph);
          setSections(buildSectionIndex(fallbackGraph.nodes));
          setStats(derivedStats(fallbackGraph.nodes));
        }
      });
  }, []);

  if (!graph || !stats) {
    return <div className="empty-panel">Loading topics…</div>;
  }

  return <PortalRouter graph={graph} sections={sections} stats={stats} />;
}
