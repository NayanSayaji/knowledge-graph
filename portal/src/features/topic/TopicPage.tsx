import { useEffect, useState } from "react";
import type { KnowledgeNode } from "../../types";
import { formatDate } from "../../lib/portal-data";
import { MarkdownDocument } from "./MarkdownDocument";

export function TopicPage({ slug, nodes }: { slug: string; nodes: KnowledgeNode[] }) {
  const node = nodes.find((candidate) => candidate.slug === slug);
  const markdownUrl = `./knowledge/nodes/${encodeURIComponent(slug)}.md`;
  const markdown = useTopicMarkdown(markdownUrl, node);

  if (!node) {
    return (
      <div className="empty-panel">
        Topic not found. <a href="#/">Return home</a>
      </div>
    );
  }

  const related = node.relations
    .map((relation) => ({ relation, node: nodes.find((item) => item.id === relation.targetId) }))
    .filter((item): item is { relation: (typeof node.relations)[number]; node: KnowledgeNode } => Boolean(item.node));

  return (
    <>
      <p className="breadcrumb">
        <a href="#/">Home</a> /{" "}
        <a href={`#/section/${encodeURIComponent(node.sections[0] ?? "Unsorted")}`}>{node.sections[0] ?? "Unsorted"}</a>{" "}
        / {node.title}
      </p>
      <article className="topic-layout">
        <div>
          <header className="topic-header">
            <div className="tag-row">
              {node.sections.map((value) => <span key={value}>{value}</span>)}
              {node.tags.map((value) => <span className="tag" key={value}>{value}</span>)}
            </div>
            <h1 className="page-title">{node.title}</h1>
            {node.summary && <p className="topic-summary">{node.summary}</p>}
            <p className="topic-updated">
              Last updated <time dateTime={node.updatedAt}>{formatDate(node.updatedAt)}</time> · {node.resources.length}{" "}
              {node.resources.length === 1 ? "source" : "sources"}
            </p>
          </header>
          {markdown ? <MarkdownDocument markdown={markdown} /> : <div className="loading">Loading topic…</div>}
        </div>
        <aside className="topic-aside">
          <div>
            <h3>Sources</h3>
            {node.resources.length ? (
              node.resources.map((resource) => (
                <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">
                  <span>{resource.title || resource.website}</span>
                  <small>{resource.website || resource.type} ↗</small>
                </a>
              ))
            ) : (
              <p>No sources attached.</p>
            )}
          </div>
          <div>
            <h3>Continue reading</h3>
            {related.length ? (
              related.map(({ relation, node: relatedNode }) => (
                <a key={relation.targetId} href={`#/topic/${relatedNode.slug}`}>
                  <span>{relatedNode.title}</span>
                  <small>{relation.type}</small>
                </a>
              ))
            ) : (
              <p>No related entries yet.</p>
            )}
          </div>
        </aside>
      </article>
    </>
  );
}

function useTopicMarkdown(markdownUrl: string, node: KnowledgeNode | undefined) {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    setMarkdown("");
    fetch(markdownUrl)
      .then((response) => (response.ok ? response.text() : Promise.reject()))
      .then(setMarkdown)
      .catch(() => {
        if (node && import.meta.env.DEV) {
          setMarkdown(`# ${node.title}\n\n## Overview\n\n${node.summary}\n\n## Notes\n\nPortal preview content.`);
        }
      });
  }, [markdownUrl, node]);

  return markdown;
}
