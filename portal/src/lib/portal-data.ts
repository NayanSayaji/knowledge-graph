import type { KnowledgeNode, PortalStats, SectionIndex } from "../types";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function repositoryUrl() {
  if (!location.hostname.endsWith(".github.io")) return "https://github.com";
  const owner = location.hostname.split(".")[0];
  const repository = location.pathname.split("/").filter(Boolean)[0];
  return repository ? `https://github.com/${owner}/${repository}` : `https://github.com/${owner}`;
}

export function derivedStats(nodes: KnowledgeNode[]): PortalStats {
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

export function buildSectionIndex(nodes: KnowledgeNode[]): SectionIndex["sections"] {
  return [...new Set(nodes.flatMap((node) => node.sections))]
    .sort()
    .map((name) => ({
      name,
      slug: name.toLowerCase(),
      nodeIds: [],
      count: nodes.filter((node) => node.sections.includes(name)).length,
    }));
}

export function uniqueSections(nodes: KnowledgeNode[]) {
  return [...new Set(nodes.flatMap((node) => node.sections))].sort();
}

