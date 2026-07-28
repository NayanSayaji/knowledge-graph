import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { KnowledgeNode } from "../../types";
import { TopicList } from "../../components/TopicList";

export function SearchPage({ nodes, initial = "" }: { nodes: KnowledgeNode[]; initial?: string }) {
  const [query, setQuery] = useState(initial);
  const fuse = useMemo(
    () =>
      new Fuse(nodes, {
        keys: ["title", "summary", "notes", "sections", "tags", "keywords"],
        threshold: 0.3,
        includeMatches: true,
      }),
    [nodes],
  );
  const results = query.trim() ? fuse.search(query).map(({ item }) => item) : nodes;

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">The full collection</p>
        <h1 className="page-title">Find a field note.</h1>
        <p className="lede">Search titles, summaries, sections, tags, and the ideas inside every entry.</p>
      </div>
      <input
        className="large-search"
        aria-label="Search all entries"
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Title, keyword, tag, section, or note…"
      />
      <p className="result-count" aria-live="polite">
        {results.length} {results.length === 1 ? "entry" : "entries"}
      </p>
      <TopicList nodes={results} />
    </>
  );
}
