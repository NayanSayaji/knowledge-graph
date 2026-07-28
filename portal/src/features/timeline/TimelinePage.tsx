import type { KnowledgeNode } from "../../types";
import { TopicList } from "../../components/TopicList";

export function TimelinePage({ nodes }: { nodes: KnowledgeNode[] }) {
  const months = [...nodes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .reduce<Record<string, KnowledgeNode[]>>((result, node) => {
      const month = new Date(node.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      result[month] = [...(result[month] ?? []), node];
      return result;
    }, {});

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Reading history</p>
        <h1 className="page-title">Timeline</h1>
        <p className="lede">A chronological index of when each idea joined the collection.</p>
      </div>
      <div className="timeline">
        {Object.entries(months).map(([month, items]) => (
          <section key={month}>
            <h2>{month}</h2>
            <TopicList nodes={items ?? []} />
          </section>
        ))}
      </div>
    </>
  );
}
