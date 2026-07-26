import type {
  KnowledgeNode,
  NodeDraft,
  Relation,
  Resource,
} from "./model";

export function normalizeResourceUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (
        key.toLowerCase().startsWith("utm_") ||
        ["fbclid", "gclid"].includes(key.toLowerCase())
      ) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function mergeStrings(existing: string[], incoming: string[]) {
  const values = new Map<string, string>();
  for (const value of [...existing, ...incoming]) {
    const trimmed = value.trim();
    if (trimmed) values.set(trimmed.toLocaleLowerCase(), trimmed);
  }
  return [...values.values()];
}

function mergeResources(existing: Resource[], incoming: Resource[]) {
  const resources = new Map<string, Resource>();
  for (const resource of existing) {
    resources.set(normalizeResourceUrl(resource.url), resource);
  }
  for (const resource of incoming) {
    const key = normalizeResourceUrl(resource.url);
    const previous = resources.get(key);
    resources.set(key, {
      url: resource.url.trim() || previous?.url || "",
      title: resource.title.trim() || previous?.title || "",
      type: resource.type || previous?.type || "article",
      website: resource.website.trim() || previous?.website || "",
    });
  }
  return [...resources.values()];
}

function mergeRelations(existing: Relation[], incoming: Relation[]) {
  return [
    ...new Map(
      [...existing, ...incoming].map((relation) => [
        `${relation.type}:${relation.targetId}`,
        relation,
      ]),
    ).values(),
  ];
}

export function mergeNodeDraft(
  existing: KnowledgeNode,
  incoming: NodeDraft,
): NodeDraft {
  return {
    title: incoming.title.trim() || existing.title,
    summary: incoming.summary.trim() || existing.summary,
    notes: incoming.notes.trim() || existing.notes,
    keywords: mergeStrings(existing.keywords, incoming.keywords),
    tags: mergeStrings(existing.tags, incoming.tags),
    sections: mergeStrings(existing.sections, incoming.sections),
    resources: mergeResources(existing.resources, incoming.resources),
    relations: mergeRelations(existing.relations, incoming.relations),
  };
}

export function findMatchingNode(
  nodes: KnowledgeNode[],
  draft: NodeDraft,
): KnowledgeNode | undefined {
  const incomingUrls = new Set(
    draft.resources
      .map((resource) => normalizeResourceUrl(resource.url))
      .filter(Boolean),
  );
  const urlMatch = incomingUrls.size
    ? nodes.find((node) =>
        node.resources.some((resource) =>
          incomingUrls.has(normalizeResourceUrl(resource.url)),
        ),
      )
    : undefined;

  return (
    urlMatch ??
    nodes.find(
      (node) => normalizeTitle(node.title) === normalizeTitle(draft.title),
    )
  );
}
