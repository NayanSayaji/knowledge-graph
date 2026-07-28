import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { KnowledgeGraph, KnowledgeNode, PortalStats, SectionIndex } from "../types";
import { previewNodes } from "../data/previewNodes";
import { derivedStats, buildSectionIndex, repositoryUrl } from "../lib/portal-data";
import { currentRoute } from "../lib/route";
import { HomePage } from "../features/home/HomePage";
import { SearchPage } from "../features/search/SearchPage";
import { SectionPage } from "../features/section/SectionPage";
import { TopicPage } from "../features/topic/TopicPage";
import { GraphPage } from "../features/graph/GraphPage";
import { TimelinePage } from "../features/timeline/TimelinePage";
import { StatsPage } from "../features/stats/StatsPage";

export function PortalApp() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [stats, setStats] = useState<PortalStats>();
  const [sections, setSections] = useState<SectionIndex["sections"]>([]);
  const [route, setRoute] = useState(currentRoute);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("kg-theme") ?? "system");

  useEffect(() => {
    const update = () => {
      setRoute(currentRoute());
      scrollTo(0, 0);
    };

    addEventListener("hashchange", update);
    Promise.all([
      fetch("./knowledge/graph.json").then((response) => response.json() as Promise<KnowledgeGraph>),
      fetch("./knowledge/sections.json").then((response) => response.json() as Promise<SectionIndex>),
      fetch("./knowledge/stats.json").then((response) => response.json() as Promise<PortalStats>),
    ])
      .then(([graph, sectionIndex, portalStats]) => {
        const active = graph.nodes.filter((node) => !node.archived);
        setNodes(active);
        setSections(sectionIndex.sections);
        setStats(portalStats);
      })
      .catch(() => {
        if (import.meta.env.DEV) {
          setNodes(previewNodes);
          setStats(derivedStats(previewNodes));
          setSections(buildSectionIndex(previewNodes));
        }
      });

    const shortcut = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".global-search input")?.focus();
      }
    };
    addEventListener("keydown", shortcut);

    return () => {
      removeEventListener("hashchange", update);
      removeEventListener("keydown", shortcut);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kg-theme", theme);
  }, [theme]);

  const fuse = useMemo(
    () =>
      new Fuse(nodes, {
        keys: ["title", "summary", "notes", "sections", "tags", "keywords"],
        threshold: 0.3,
      }),
    [nodes],
  );
  const searchResults = query ? fuse.search(query).map(({ item }) => item) : [];
  const path = route.split("/").filter(Boolean);
  const content =
    route === "/" ? (
      <HomePage nodes={nodes} stats={stats ?? derivedStats(nodes)} />
    ) : path[0] === "topic" ? (
      <TopicPage slug={path.slice(1).join("/")} nodes={nodes} />
    ) : path[0] === "section" ? (
      <SectionPage name={path.slice(1).join("/")} nodes={nodes} />
    ) : path[0] === "search" ? (
      <SearchPage nodes={nodes} />
    ) : path[0] === "graph" ? (
      <GraphPage nodes={nodes} />
    ) : path[0] === "timeline" ? (
      <TimelinePage nodes={nodes} />
    ) : path[0] === "stats" ? (
      <StatsPage nodes={nodes} stats={stats ?? derivedStats(nodes)} />
    ) : (
      <div className="empty-panel">Page not found.</div>
    );

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
            <a className={route === "/" ? "active" : ""} href="#/">
              Journal
            </a>
            <a className={route.startsWith("/search") ? "active" : ""} href="#/search">
              Topics
            </a>
            <a className={route.startsWith("/graph") ? "active" : ""} href="#/graph">
              Graph
            </a>
            <a className={route.startsWith("/timeline") ? "active" : ""} href="#/timeline">
              Timeline
            </a>
            <a className={route.startsWith("/stats") ? "active" : ""} href="#/stats">
              Index
            </a>
          </nav>
          <div className="header-actions">
            <select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <a className="github-link" href={repositoryUrl()} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </div>
        </div>
        <div className="utility-bar">
          <div className="global-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search your knowledge"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your knowledge…"
            />
            <kbd>/</kbd>
            {query && (
              <div className="search-results">
                {searchResults.slice(0, 7).map((node) => (
                  <a key={node.id} href={`#/topic/${node.slug}`} onClick={() => setQuery("")}>
                    <strong>{node.title}</strong>
                    <small>{node.sections.join(" · ")}</small>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="section-links" aria-label="Sections">
            {sections.slice(0, 6).map((section) => (
              <a key={section.name} href={`#/section/${encodeURIComponent(section.name)}`}>
                {section.name}
                <span>{section.count}</span>
              </a>
            ))}
          </div>
        </div>
      </header>
      <main>
        <section className="page">{content}</section>
        <footer>Generated by KnowlegeGraph · Markdown remains the source of truth.</footer>
      </main>
    </div>
  );
}
