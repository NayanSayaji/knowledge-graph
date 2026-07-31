import { useEffect, useState } from "react";
import type { KnowledgeGraph, PortalStats, SectionIndex } from "../types";
import { buildSectionIndex, derivedStats } from "../lib/portal-data";
import { previewNodes } from "../data/previewNodes";
import { PortalRouter } from "./PortalRouter";

export function PortalApp() {
  const [graph, setGraph] = useState<KnowledgeGraph>();
  const [sections, setSections] = useState<SectionIndex["sections"]>([]);
  const [stats, setStats] = useState<PortalStats>();

  useEffect(() => {
    Promise.all([
      fetch("./knowledge/graph.json").then((response) => response.json() as Promise<KnowledgeGraph>),
      fetch("./knowledge/sections.json").then((response) => response.json() as Promise<SectionIndex>),
      fetch("./knowledge/stats.json").then((response) => response.json() as Promise<PortalStats>),
    ])
      .then(([loadedGraph, loadedSections, loadedStats]) => {
        setGraph(loadedGraph);
        setSections(loadedSections.sections);
        setStats(loadedStats);
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          const fallbackGraph: KnowledgeGraph = {
            version: 1,
            generatedAt: new Date().toISOString(),
            nodes: previewNodes,
          };
          setGraph(fallbackGraph);
          setSections(buildSectionIndex(previewNodes));
          setStats(derivedStats(previewNodes));
        }
      });
  }, []);

  if (!graph || !stats) {
    return <div className="empty-panel">Loading topics…</div>;
  }

  return <PortalRouter graph={graph} sections={sections} stats={stats} />;
}
