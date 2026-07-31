import type { KnowledgeNode, PortalStats, SectionIndex } from "../types";

function normalizeSectionName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function canonicalSectionKey(value: string) {
  return normalizeSectionName(value).toLowerCase();
}

export function normalizeNodeSections(node: KnowledgeNode): KnowledgeNode {
  const seen = new Map<string, string>();
  node.sections.forEach((section) => {
    const normalized = normalizeSectionName(section);
    seen.set(canonicalSectionKey(section), normalized);
  });
  return {
    ...node,
    sections: [...seen.values()],
  };
}

export function normalizeGraphSections(nodes: KnowledgeNode[]) {
  return nodes.map(normalizeNodeSections);
}

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
  const normalizedSections = nodes.flatMap((node) => node.sections.map((section) => canonicalSectionKey(section)));
  nodes.flatMap((node) => node.resources).forEach((resource) => {
    resourceTypes[resource.type] = (resourceTypes[resource.type] ?? 0) + 1;
  });
  return {
    generatedAt: new Date().toISOString(),
    topics: nodes.length,
    sections: new Set(normalizedSections).size,
    resources: nodes.reduce((count, node) => count + node.resources.length, 0),
    resourceTypes,
    averageTags: nodes.length ? nodes.reduce((count, node) => count + node.tags.length, 0) / nodes.length : 0,
    relationships: nodes.reduce((count, node) => count + node.relations.length, 0),
  };
}

export function buildSectionIndex(nodes: KnowledgeNode[]): SectionIndex["sections"] {
  const sections = new Map<string, { name: string; nodeIds: string[] }>();
  nodes.forEach((node) => {
    node.sections.forEach((section) => {
      const key = canonicalSectionKey(section);
      const name = normalizeSectionName(section);
      const current = sections.get(key);
      sections.set(key, {
        name,
        nodeIds: [...(current?.nodeIds ?? []), node.id],
      });
    });
  });
  return [...sections.entries()]
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([, value]) => ({
      name: value.name,
      slug: value.name.toLowerCase(),
      nodeIds: value.nodeIds,
      count: value.nodeIds.length,
    }));
}

export function uniqueSections(nodes: KnowledgeNode[]) {
  return [...new Set(nodes.flatMap((node) => node.sections.map((section) => canonicalSectionKey(section))))]
    .map((section) => normalizeSectionName(section))
    .sort();
}
