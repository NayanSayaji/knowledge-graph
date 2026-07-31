import type { KnowledgeNode, PortalStats } from "../../types";
import { uniqueSections } from "../../lib/portal-data";
import { TopicList } from "../../components/TopicList";

export function HomePage({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const sections = uniqueSections(nodes);
  const recent = [...nodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="home-page">
      <section className="home-intro">
        <div>
          <p className="eyebrow">A developer reading collection</p>
          <h1>Notes worth<br />returning to.</h1>
        </div>
        <div className="intro-note">
          <p>Field notes on systems, software, and the ideas connecting them.</p>
          <div className="stats-inline">
            <span><strong>{stats.topics}</strong> entries</span>
            <span><strong>{stats.sections}</strong> sections</span>
            <span><strong>{stats.resources}</strong> sources</span>
          </div>
        </div>
      </section>

      <section className="collection-feed">
        <div className="collection-heading">
          <div>
            <p className="collection-label">The collection</p>
            <h2>All topics</h2>
          </div>
          <a href="#/search">Browse all</a>
        </div>
        <TopicList nodes={recent} />
      </section>

      <section className="section-accordions">
        <div className="section-heading">
          <div>
            <p className="collection-label">Sections</p>
            <h2>Open a section to see its topics</h2>
          </div>
        </div>
        {sections.map((section) => {
          const grouped = nodes.filter((node) => node.sections.includes(section));
          return (
            <details className="section-accordion" key={section}>
              <summary>
                <span>{section}</span>
                <small>{grouped.length}</small>
              </summary>
              <TopicList nodes={grouped} />
            </details>
          );
        })}
      </section>
    </div>
  );
}
