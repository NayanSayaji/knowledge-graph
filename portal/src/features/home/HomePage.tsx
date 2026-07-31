import type { KnowledgeNode, PortalStats } from "../../types";
import { formatDate, uniqueSections } from "../../lib/portal-data";
import { TopicList } from "../../components/TopicList";

export function HomePage({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const sections = uniqueSections(nodes);
  const recent = [...nodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const featured = recent[0];

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

      {featured && (
        <section className="featured-wrap">
          <p className="collection-label">Latest entry</p>
          <a className="featured-story" href={`#/topic/${featured.slug}`}>
            <div className="featured-meta">
              <span>{featured.sections[0] ?? "Unsorted"}</span>
              <time dateTime={featured.updatedAt}>{formatDate(featured.updatedAt)}</time>
            </div>
            <h2>{featured.title}</h2>
            <p>{featured.summary || "Open this entry to read the complete note."}</p>
            <span className="read-link">
              Read entry <span aria-hidden="true">↗</span>
            </span>
          </a>
        </section>
      )}

      <div className="collection-layout">
        <section className="collection-feed">
          <div className="collection-heading">
            <div>
              <p className="collection-label">The collection</p>
              <h2>Recently updated</h2>
            </div>
            <a href="#/search">Browse all</a>
          </div>
          <TopicList nodes={recent.slice(featured ? 1 : 0)} />
        </section>
        <aside className="collection-sections">
          <p className="collection-label">Browse sections</p>
          {sections.map((section) => {
            const count = nodes.filter((node) => node.sections.includes(section.name)).length;
            return (
              <a href={`#/section/${encodeURIComponent(section.name)}`} key={section.name}>
                <span>{section.name}</span>
                <small>{count}</small>
              </a>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
