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

function TopicList({ nodes }: { nodes: KnowledgeNode[] }) {
  if (!nodes.length) return <div className="empty-panel">No topics match this view yet.</div>;
  return (
    <div className="topic-list">
      {nodes.map((node) => (
        <a href={`#/topic/${node.slug}`} key={node.id}>
          <div><strong>{node.title}</strong><p>{node.summary || "Notes are waiting to be expanded."}</p></div>
          <span>{node.sections[0] ?? "Unsorted"} · {new Date(node.updatedAt).toLocaleDateString()}</span>
        </a>
      ))}
    </div>
  );
}

function Home({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const sections = [...new Set(nodes.flatMap((node) => node.sections))].sort();
  const recent = [...nodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  return (
    <>
      <p className="eyebrow">Your second brain, published</p>
      <h1>Knowledge that compounds.</h1>
      <p className="lede">A living documentation portal generated automatically from every topic you capture.</p>
      <div className="stats-strip">
        <div><strong>{stats.topics}</strong><span>Topics</span></div>
        <div><strong>{stats.sections}</strong><span>Sections</span></div>
        <div><strong>{stats.resources}</strong><span>Resources</span></div>
      </div>
      <div className="section-heading"><div><p className="eyebrow">Browse the map</p><h2>Explore by section</h2></div><a href="#/search">View all topics →</a></div>
      <div className="category-grid">
        {sections.map((section, index) => (
          <a className="category-card" href={`#/section/${encodeURIComponent(section)}`} key={section}>
            <span>{String(index + 1).padStart(2, "0")}</span><h3>{section}</h3>
            <p>{nodes.filter((node) => node.sections.includes(section)).length} documented topics</p>
          </a>
        ))}
      </div>
      <div className="section-heading"><div><p className="eyebrow">Fresh from the graph</p><h2>Recently updated</h2></div></div>
      <TopicList nodes={recent} />
    </>
  );
}

function SearchPage({ nodes, initial = "" }: { nodes: KnowledgeNode[]; initial?: string }) {
  const [query, setQuery] = useState(initial);
  const fuse = useMemo(() => new Fuse(nodes, { keys: ["title", "summary", "notes", "sections", "tags", "keywords"], threshold: 0.3, includeMatches: true }), [nodes]);
  const results = query.trim() ? fuse.search(query).map(({ item }) => item) : nodes;
  return (
    <>
      <p className="eyebrow">Find anything</p><h1 className="page-title">Search the graph</h1>
      <input className="large-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, keyword, tag, section, or note…" />
      <p className="result-count">{results.length} {results.length === 1 ? "result" : "results"}</p>
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
      <p className="eyebrow">Knowledge section</p><h1 className="page-title">{name}</h1>
      <p className="lede">{selected.length} topics collected across this section.</p>
      <input className="large-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search inside ${name}…`} />
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
          <div className="tag-row">{node.sections.map((value) => <span key={value}>{value}</span>)}{node.tags.map((value) => <span className="tag" key={value}>{value}</span>)}</div>
          <h1 className="page-title">{node.title}</h1>
          <p className="topic-updated">Updated {new Date(node.updatedAt).toLocaleDateString()}</p>
          {markdown ? <MarkdownDocument markdown={markdown} /> : <div className="loading">Loading topic…</div>}
        </div>
        <aside className="topic-aside">
          <h3>Resources</h3>
          {node.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.title || resource.website}<small>{resource.type}</small></a>)}
          <h3>Related topics</h3>
          {related.map(({ relation, node: relatedNode }) => <a key={relation.targetId} href={`#/topic/${relatedNode!.slug}`}>{relatedNode!.title}<small>{relation.type}</small></a>)}
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
      <p className="eyebrow">Relationships</p><h1 className="page-title">Knowledge graph</h1>
      <div className="graph-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Highlight a node…" /><button onClick={() => setScale(Math.max(.6, scale - .2))}>−</button><span>{Math.round(scale * 100)}%</span><button onClick={() => setScale(Math.min(1.8, scale + .2))}>+</button></div>
      <div className="graph-canvas">
        <svg viewBox="0 0 840 600" style={{ transform: `scale(${scale})` }}>
          {nodes.flatMap((node) => node.relations.map((relation) => {
            const from = positions.get(node.id); const to = positions.get(relation.targetId);
            return from && to ? <line key={`${node.id}-${relation.targetId}-${relation.type}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} /> : null;
          }))}
          {nodes.map((node) => { const point = positions.get(node.id)!; const highlighted = !query || visible.includes(node); return <g className={highlighted ? "graph-node" : "graph-node dim"} key={node.id} onClick={() => { location.hash = `/topic/${node.slug}`; }}><circle cx={point.x} cy={point.y} r={node.favorite ? 28 : 22} /><text x={point.x} y={point.y + 4}>{node.title.slice(0, 18)}</text></g>; })}
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
  return <><p className="eyebrow">Learning activity</p><h1 className="page-title">Timeline</h1><div className="timeline">{Object.entries(months).map(([month, items]) => <section key={month}><h2>{month}</h2><TopicList nodes={items ?? []} /></section>)}</div></>;
}

function StatsPage({ nodes, stats }: { nodes: KnowledgeNode[]; stats: PortalStats }) {
  const connected = [...nodes].sort((a, b) => b.relations.length - a.relations.length).slice(0, 5);
  const cards: Array<[string, string | number]> = [["Topics", stats.topics], ["Sections", stats.sections], ["Resources", stats.resources], ["Relationships", stats.relationships], ["Average tags", stats.averageTags.toFixed(1)], ["Documentation", stats.resourceTypes.documentation ?? 0], ["Videos", stats.resourceTypes.video ?? 0], ["Articles", stats.resourceTypes.article ?? 0]];
  return <><p className="eyebrow">Analytics</p><h1 className="page-title">Graph statistics</h1><div className="metric-grid">{cards.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="section-heading"><div><p className="eyebrow">Network</p><h2>Most connected</h2></div></div><TopicList nodes={connected} /></>;
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
      <aside className="sidebar">
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
        <nav><a className={route === "/" ? "active" : ""} href="#/">Overview</a><a href="#/search">Topics</a><a href="#/graph">Graph</a><a href="#/timeline">Timeline</a><a href="#/stats">Statistics</a></nav>
        <p className="nav-label">Sections</p><div className="section-links">{sections.map((section) => <a key={section.name} href={`#/section/${encodeURIComponent(section.name)}`}>{section.name}<span>{section.count}</span></a>)}</div>
      </aside>
      <main>
        <header>
          <div className="global-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your knowledge…" /><kbd>/</kbd>{query && <div className="search-results">{searchResults.slice(0, 7).map((node) => <a key={node.id} href={`#/topic/${node.slug}`} onClick={() => setQuery("")}><strong>{node.title}</strong><small>{node.sections.join(" · ")}</small></a>)}</div>}</div>
          <div className="header-actions"><select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><a className="github-link" href={repositoryUrl()} target="_blank">GitHub ↗</a></div>
        </header>
        <section className="page">{content}</section>
        <footer>Generated by KnowlegeGraph · Markdown remains the source of truth.</footer>
      </main>
    </div>
  );
}
