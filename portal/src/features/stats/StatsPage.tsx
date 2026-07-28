import type { KnowledgeNode, PortalStats } from "../../types";
import { TopicList } from "../../components/TopicList";

export function StatsPage({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const connected = [...nodes].sort((a, b) => b.relations.length - a.relations.length).slice(0, 5);
  const cards: Array<[string, string | number]> = [
    ["Topics", stats.topics],
    ["Sections", stats.sections],
    ["Resources", stats.resources],
    ["Relationships", stats.relationships],
    ["Average tags", stats.averageTags.toFixed(1)],
    ["Documentation", stats.resourceTypes.documentation ?? 0],
    ["Videos", stats.resourceTypes.video ?? 0],
    ["Articles", stats.resourceTypes.article ?? 0],
  ];

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Collection index</p>
        <h1 className="page-title">Library statistics</h1>
        <p className="lede">A compact view of the subjects, sources, and relationships in this journal.</p>
      </div>
      <div className="metric-grid">
        {cards.map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reading paths</p>
          <h2>Most connected</h2>
        </div>
      </div>
      <TopicList nodes={connected} />
    </>
  );
}
