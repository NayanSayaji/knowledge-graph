import { useState } from "react";
import type { KnowledgeNode } from "../../types";
import { TopicList } from "../../components/TopicList";

export function SectionPage({ name, nodes }: { name: string; nodes: KnowledgeNode[] }) {
  const [query, setQuery] = useState("");
  const selected = nodes.filter((node) => node.sections.includes(name) && node.title.toLowerCase().includes(query.toLowerCase()));
  const groups = selected.reduce<Record<string, KnowledgeNode[]>>((result, node) => {
    const letter = node.title[0]?.toUpperCase() ?? "#";
    result[letter] = [...(result[letter] ?? []), node];
    return result;
  }, {});

  return (
    <>
      <p className="breadcrumb">
        <a href="#/">Home</a> / Sections / {name}
      </p>
      <div className="page-heading">
        <p className="eyebrow">Section archive</p>
        <h1 className="page-title">{name}</h1>
        <p className="lede">
          {selected.length} {selected.length === 1 ? "entry" : "entries"} collected in this reading shelf.
        </p>
      </div>
      <input
        className="large-search"
        aria-label={`Search inside ${name}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search inside ${name}…`}
      />
      {Object.entries(groups)
        .sort()
        .map(([letter, group]) => (
          <section className="alphabet-group" key={letter}>
            <h2>{letter}</h2>
            <TopicList nodes={group ?? []} />
          </section>
        ))}
    </>
  );
}
