import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { MarkdownDocument } from "./MarkdownDocument";
import type { KnowledgeGraph, KnowledgeNode, PortalStats, SectionIndex } from "./types";

const previewNodes: KnowledgeNode[] = [
  { id: "redis", slug: "redis-streams", title: "Redis Streams", summary: "Durable event streams, consumer groups, and delivery semantics.", notes: "", sections: ["Backend", "Database"], tags: ["redis", "distributed-systems"], keywords: ["streams", "consumer groups"], resources: [{ title: "Redis docs", url: "https://redis.io", type: "documentation", website: "redis.io" }], relations: [{ targetId: "kafka", type: "related" }], archived: false, favorite: true, createdAt: "2026-07-12T00:00:00.000Z", updatedAt: "2026-07-26T00:00:00.000Z" },
  { id: "cap", slug: "cap-theorem", title: "CAP Theorem", summary: "Reasoning about consistency and availability during partitions.", notes: "", sections: ["HLD"], tags: ["architecture"], keywords: ["consistency", "availability"], resources: [{ title: "Reference", url: "https://example.com", type: "article", website: "example.com" }], relations: [{ targetId: "redis", type: "related" }], archived: false, favorite: false, createdAt: "2026-07-04T00:00:00.000Z", updatedAt: "2026-07-22T00:00:00.000Z" },
  { id: "kafka", slug: "kafka-consumer-groups", title: "Kafka Consumer Groups", summary: "Partition assignment, offsets, rebalancing, and throughput.", notes: "", sections: ["Backend"], tags: ["kafka"], keywords: ["offsets", "partitions"], resources: [{ title: "Talk", url: "https://example.com", type: "video", website: "example.com" }], relations: [{ targetId: "redis", type: "related" }], archived: false, favorite: false, createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-24T00:00:00.000Z" },
];

function currentRoute() {
  return decodeURIComponent(location.hash.slice(1) || "/");
}

function repositoryUrl() {
  if (!location.hostname.endsWith(".github.io")) return "https://github.com";
  const owner = location.hostname.split(".")[0];
  const repository = location.pathname.split("/").filter(Boolean)[0];
  return repository ? `https://github.com/${owner}/${repository}` : `https://github.com/${owner}`;
}

function derivedStats(nodes: KnowledgeNode[]): PortalStats {
  const resourceTypes: Record<string, number> = {};
  nodes.flatMap((node) => node.resources).forEach((resource) => {
    resourceTypes[resource.type] = (resourceTypes[resource.type] ?? 0) + 1;
  });
  return {
    generatedAt: new Date().toISOString(),
    topics: nodes.length,
    sections: new Set(nodes.flatMap((node) => node.sections)).size,
    resources: nodes.reduce((count, node) => count + node.resources.length, 0),
    resourceTypes,
    averageTags: nodes.length ? nodes.reduce((count, node) => count + node.tags.length, 0) / nodes.length : 0,
    relationships: nodes.reduce((count, node) => count + node.relations.length, 0),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function TopicList({ nodes }: { nodes: KnowledgeNode[] }) {
  if (!nodes.length) return <div className="empty-panel">No topics match this view yet.</div>;
  return (
    <div className="topic-list">
      {nodes.map((node, index) => (
        <a href={`#/topic/${node.slug}`} key={node.id}>
          <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
          <div className="topic-copy">
            <span className="topic-meta">{node.sections[0] ?? "Unsorted"} · <time dateTime={node.updatedAt}>{formatDate(node.updatedAt)}</time></span>
            <strong>{node.title}</strong>
            <p>{node.summary || "Notes are waiting to be expanded."}</p>
            <span className="topic-tags">{node.tags.slice(0, 3).join(" · ")}</span>
          </div>
          <span className="topic-arrow" aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}

function Home({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const sections = [...new Set(nodes.flatMap((node) => node.sections))].sort();
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
            <span className="read-link">Read entry <span aria-hidden="true">↗</span></span>
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
            const count = nodes.filter((node) => node.sections.includes(section)).length;
            return (
              <a href={`#/section/${encodeURIComponent(section)}`} key={section}>
                <span>{section}</span><small>{count}</small>
              </a>
            );
          })}
        </aside>
      </div>
    </div>
  );
}

function SearchPage({ nodes, initial = "" }: { nodes: KnowledgeNode[]; initial?: string }) {
  const [query, setQuery] = useState(initial);
  const fuse = useMemo(() => new Fuse(nodes, { keys: ["title", "summary", "notes", "sections", "tags", "keywords"], threshold: 0.3, includeMatches: true }), [nodes]);
  const results = query.trim() ? fuse.search(query).map(({ item }) => item) : nodes;
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">The full collection</p>
        <h1 className="page-title">Find a field note.</h1>
        <p className="lede">Search titles, summaries, sections, tags, and the ideas inside every entry.</p>
      </div>
      <input className="large-search" aria-label="Search all entries" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, keyword, tag, section, or note…" />
      <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "entry" : "entries"}</p>
      <TopicList nodes={results} />
    </>
  );
}

function SectionPage({ name, nodes }: { name: string; nodes: KnowledgeNode[] }) {
  const [query, setQuery] = useState("");
  const selected = nodes.filter((node) => node.sections.includes(name) && node.title.toLowerCase().includes(query.toLowerCase()));
  const groups = selected.reduce<Record<string, KnowledgeNode[]>>(
    (result, node) => {
      const letter = node.title[0]?.toUpperCase() ?? "#";
      result[letter] = [...(result[letter] ?? []), node];
      return result;
    },
    {},
  );
  return (
    <>
      <p className="breadcrumb"><a href="#/">Home</a> / Sections / {name}</p>
      <div className="page-heading">
        <p className="eyebrow">Section archive</p>
        <h1 className="page-title">{name}</h1>
        <p className="lede">{selected.length} {selected.length === 1 ? "entry" : "entries"} collected in this reading shelf.</p>
      </div>
      <input className="large-search" aria-label={`Search inside ${name}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search inside ${name}…`} />
      {Object.entries(groups).sort().map(([letter, group]) => <section className="alphabet-group" key={letter}><h2>{letter}</h2><TopicList nodes={group ?? []} /></section>)}
    </>
  );
}

function TopicPage({ slug, nodes }: { slug: string; nodes: KnowledgeNode[] }) {
  const node = nodes.find((candidate) => candidate.slug === slug);
  const [markdown, setMarkdown] = useState("");
  useEffect(() => {
    setMarkdown("");
    fetch(`./knowledge/nodes/${encodeURIComponent(slug)}.md`).then((response) => response.ok ? response.text() : Promise.reject()).then(setMarkdown).catch(() => {
      if (node && import.meta.env.DEV) setMarkdown(`# ${node.title}\n\n## Overview\n\n${node.summary}\n\n## Notes\n\nPortal preview content.`);
    });
  }, [slug, node]);
  if (!node) return <div className="empty-panel">Topic not found. <a href="#/">Return home</a></div>;
  const related = node.relations.map((relation) => ({ relation, node: nodes.find((item) => item.id === relation.targetId) })).filter((item) => item.node);
  return (
    <>
      <p className="breadcrumb"><a href="#/">Home</a> / <a href={`#/section/${encodeURIComponent(node.sections[0] ?? "Unsorted")}`}>{node.sections[0] ?? "Unsorted"}</a> / {node.title}</p>
      <article className="topic-layout">
        <div>
          <header className="topic-header">
            <div className="tag-row">{node.sections.map((value) => <span key={value}>{value}</span>)}{node.tags.map((value) => <span className="tag" key={value}>{value}</span>)}</div>
            <h1 className="page-title">{node.title}</h1>
            {node.summary && <p className="topic-summary">{node.summary}</p>}
            <p className="topic-updated">Last updated <time dateTime={node.updatedAt}>{formatDate(node.updatedAt)}</time> · {node.resources.length} {node.resources.length === 1 ? "source" : "sources"}</p>
          </header>
          {markdown ? <MarkdownDocument markdown={markdown} /> : <div className="loading">Loading topic…</div>}
        </div>
        <aside className="topic-aside">
          <div>
            <h3>Sources</h3>
            {node.resources.length ? node.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer"><span>{resource.title || resource.website}</span><small>{resource.website || resource.type} ↗</small></a>) : <p>No sources attached.</p>}
          </div>
          <div>
            <h3>Continue reading</h3>
            {related.length ? related.map(({ relation, node: relatedNode }) => <a key={relation.targetId} href={`#/topic/${relatedNode!.slug}`}><span>{relatedNode!.title}</span><small>{relation.type}</small></a>) : <p>No related entries yet.</p>}
          </div>
        </aside>
      </article>
    </>
  );
}

function GraphPage({ nodes }: { nodes: KnowledgeNode[] }) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(1);
  const visible = nodes.filter((node) => node.title.toLowerCase().includes(query.toLowerCase()));
  const positions = new Map(nodes.map((node, index) => [node.id, { x: 420 + Math.cos(index * 2.4) * (170 + index * 8), y: 300 + Math.sin(index * 2.4) * (170 + index * 8) }]));
  return (
    <>
      <div className="page-heading"><p className="eyebrow">Connections</p><h1 className="page-title">Knowledge graph</h1><p className="lede">Follow the relationships between ideas in the collection.</p></div>
      <div className="graph-toolbar"><input aria-label="Highlight a graph node" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Highlight a node…" /><button type="button" aria-label="Zoom out" onClick={() => setScale(Math.max(.6, scale - .2))}>−</button><span aria-live="polite">{Math.round(scale * 100)}%</span><button type="button" aria-label="Zoom in" onClick={() => setScale(Math.min(1.8, scale + .2))}>+</button></div>
      <div className="graph-canvas">
        <svg viewBox="0 0 840 600" style={{ transform: `scale(${scale})` }}>
          {nodes.flatMap((node) => node.relations.map((relation) => {
            const from = positions.get(node.id); const to = positions.get(relation.targetId);
            return from && to ? <line key={`${node.id}-${relation.targetId}-${relation.type}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} /> : null;
          }))}
          {nodes.map((node) => { const point = positions.get(node.id)!; const highlighted = !query || visible.includes(node); const openNode = () => { location.hash = `/topic/${node.slug}`; }; return <g className={highlighted ? "graph-node" : "graph-node dim"} key={node.id} role="link" tabIndex={0} aria-label={`Open ${node.title}`} onClick={openNode} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openNode(); } }}><circle cx={point.x} cy={point.y} r={node.favorite ? 28 : 22} /><text x={point.x} y={point.y + 4}>{node.title.slice(0, 18)}</text></g>; })}
        </svg>
      </div>
    </>
  );
}

function TimelinePage({ nodes }: { nodes: KnowledgeNode[] }) {
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
  return <><div className="page-heading"><p className="eyebrow">Reading history</p><h1 className="page-title">Timeline</h1><p className="lede">A chronological index of when each idea joined the collection.</p></div><div className="timeline">{Object.entries(months).map(([month, items]) => <section key={month}><h2>{month}</h2><TopicList nodes={items ?? []} /></section>)}</div></>;
}

function StatsPage({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const connected = [...nodes].sort((a, b) => b.relations.length - a.relations.length).slice(0, 5);
  const cards: Array<[string, string | number]> = [["Topics", stats.topics], ["Sections", stats.sections], ["Resources", stats.resources], ["Relationships", stats.relationships], ["Average tags", stats.averageTags.toFixed(1)], ["Documentation", stats.resourceTypes.documentation ?? 0], ["Videos", stats.resourceTypes.video ?? 0], ["Articles", stats.resourceTypes.article ?? 0]];
  return <><div className="page-heading"><p className="eyebrow">Collection index</p><h1 className="page-title">Library statistics</h1><p className="lede">A compact view of the subjects, sources, and relationships in this journal.</p></div><div className="metric-grid">{cards.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="section-heading"><div><p className="eyebrow">Reading paths</p><h2>Most connected</h2></div></div><TopicList nodes={connected} /></>;
}

export function App() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [stats, setStats] = useState<PortalStats>();
  const [sections, setSections] = useState<SectionIndex["sections"]>([]);
  const [route, setRoute] = useState(currentRoute);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("kg-theme") ?? "system");

  useEffect(() => {
    const update = () => { setRoute(currentRoute()); scrollTo(0, 0); };
    addEventListener("hashchange", update);
    Promise.all([
      fetch("./knowledge/graph.json").then((response) => response.json() as Promise<KnowledgeGraph>),
      fetch("./knowledge/sections.json").then((response) => response.json() as Promise<SectionIndex>),
      fetch("./knowledge/stats.json").then((response) => response.json() as Promise<PortalStats>),
    ]).then(([graph, sectionIndex, portalStats]) => {
      const active = graph.nodes.filter((node) => !node.archived);
      setNodes(active); setSections(sectionIndex.sections); setStats(portalStats);
    }).catch(() => {
      if (import.meta.env.DEV) { setNodes(previewNodes); setStats(derivedStats(previewNodes)); setSections([...new Set(previewNodes.flatMap((node) => node.sections))].map((name) => ({ name, slug: name.toLowerCase(), nodeIds: [], count: previewNodes.filter((node) => node.sections.includes(name)).length }))); }
    });
    const shortcut = (event: KeyboardEvent) => { if (event.key === "/" && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); document.querySelector<HTMLInputElement>(".global-search input")?.focus(); } };
    addEventListener("keydown", shortcut);
    return () => { removeEventListener("hashchange", update); removeEventListener("keydown", shortcut); };
  }, []);

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("kg-theme", theme); }, [theme]);
  const fuse = useMemo(() => new Fuse(nodes, { keys: ["title", "summary", "notes", "sections", "tags", "keywords"], threshold: .3 }), [nodes]);
  const searchResults = query ? fuse.search(query).map(({ item }) => item) : [];
  const path = route.split("/").filter(Boolean);
  const content = route === "/" ? <Home nodes={nodes} stats={stats ?? derivedStats(nodes)} /> : path[0] === "topic" ? <TopicPage slug={path.slice(1).join("/")} nodes={nodes} /> : path[0] === "section" ? <SectionPage name={path.slice(1).join("/")} nodes={nodes} /> : path[0] === "search" ? <SearchPage nodes={nodes} /> : path[0] === "graph" ? <GraphPage nodes={nodes} /> : path[0] === "timeline" ? <TimelinePage nodes={nodes} /> : path[0] === "stats" ? <StatsPage nodes={nodes} stats={stats ?? derivedStats(nodes)} /> : <div className="empty-panel">Page not found.</div>;

  return (
    <div className="portal-shell">
      <header className="site-header">
        <div className="masthead">
          <a className="logo" href="#/">
            <span aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="6" r="3" />
                <circle cx="7" cy="23" r="3" />
                <circle cx="25" cy="23" r="3" />
                <path d="M14.5 8.7 8.6 20M17.5 8.7 23.4 20M10 23h12" />
              </svg>
            </span>
            <span className="logo-copy">
              <strong>KnowlegeGraph</strong>
              <small>Developer field notes</small>
            </span>
          </a>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a className={route === "/" ? "active" : ""} href="#/">Journal</a>
            <a className={route.startsWith("/search") ? "active" : ""} href="#/search">Topics</a>
            <a className={route.startsWith("/graph") ? "active" : ""} href="#/graph">Graph</a>
            <a className={route.startsWith("/timeline") ? "active" : ""} href="#/timeline">Timeline</a>
            <a className={route.startsWith("/stats") ? "active" : ""} href="#/stats">Index</a>
          </nav>
          <div className="header-actions"><select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><a className="github-link" href={repositoryUrl()} target="_blank" rel="noreferrer">GitHub ↗</a></div>
        </div>
        <div className="utility-bar">
          <div className="global-search"><span aria-hidden="true">⌕</span><input aria-label="Search your knowledge" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your knowledge…" /><kbd>/</kbd>{query && <div className="search-results">{searchResults.slice(0, 7).map((node) => <a key={node.id} href={`#/topic/${node.slug}`} onClick={() => setQuery("")}><strong>{node.title}</strong><small>{node.sections.join(" · ")}</small></a>)}</div>}</div>
          <div className="section-links" aria-label="Sections">{sections.slice(0, 6).map((section) => <a key={section.name} href={`#/section/${encodeURIComponent(section.name)}`}>{section.name}<span>{section.count}</span></a>)}</div>
        </div>
      </header>
      <main>
        <section className="page">{content}</section>
        <footer>Generated by KnowlegeGraph · Markdown remains the source of truth.</footer>
      </main>
    </div>
  );
}
