import type { KnowledgeNode } from "@/domain/knowledge-node/model";

function yamlString(value: string) {
  return JSON.stringify(value);
}

function yamlList(values: string[]) {
  return values.length
    ? values.map((value) => `  - ${yamlString(value)}`).join("\n")
    : "  []";
}

export function generateNodeMarkdown(node: KnowledgeNode) {
  const resources = node.resources.length
    ? node.resources
        .map(
          (resource) =>
            `- [${resource.title || resource.website}](${resource.url})`,
        )
        .join("\n")
    : "_No resources yet._";

  return `---
id: ${yamlString(node.id)}
title: ${yamlString(node.title)}
slug: ${yamlString(node.slug)}
archived: ${node.archived}
favorite: ${node.favorite}
sections:
${yamlList(node.sections)}
keywords:
${yamlList(node.keywords)}
tags:
${yamlList(node.tags)}
createdAt: ${yamlString(node.createdAt)}
updatedAt: ${yamlString(node.updatedAt)}
---

# ${node.title}

## Links

${resources}
`;
}

export function generateGraphJson(nodes: KnowledgeNode[]) {
  return JSON.stringify(
    {
      version: 2,
      generatedAt: new Date().toISOString(),
      nodes,
    },
    null,
    2,
  );
}

export function generateSectionsJson(nodes: KnowledgeNode[]) {
  const active = uniqueByMarkdownPath(
    nodes.filter((node) => !node.archived),
  );
  const sections = new Map<string, string[]>();
  for (const node of active) {
    const memberships = node.sections.length ? node.sections : ["Unsorted"];
    for (const section of memberships) {
      sections.set(section, [...(sections.get(section) ?? []), node.id]);
    }
  }
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sections: [...sections.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, nodeIds]) => ({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          nodeIds,
          count: nodeIds.length,
        })),
    },
    null,
    2,
  );
}

export function generateStatsJson(nodes: KnowledgeNode[]) {
  const active = uniqueByMarkdownPath(
    nodes.filter((node) => !node.archived),
  );
  const resourceTypes: Record<string, number> = {};
  for (const resource of active.flatMap((node) => node.resources)) {
    resourceTypes[resource.type] = (resourceTypes[resource.type] ?? 0) + 1;
  }
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      topics: active.length,
      sections: new Set(
        active.flatMap((node) =>
          node.sections.length ? node.sections : ["Unsorted"],
        ),
      ).size,
      resources: active.reduce(
        (count, node) => count + node.resources.length,
        0,
      ),
      resourceTypes,
      averageTags: active.length
        ? active.reduce((count, node) => count + node.tags.length, 0) /
          active.length
        : 0,
      relationships: active.reduce(
        (count, node) => count + node.relations.length,
        0,
      ),
    },
    null,
    2,
  );
}

function escapeTable(value: string) {
  return value
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function encodeRepositoryPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function uniqueByMarkdownPath(nodes: KnowledgeNode[]) {
  const unique = new Map<string, KnowledgeNode>();
  for (const node of [...nodes].sort((left, right) =>
    left.updatedAt.localeCompare(right.updatedAt),
  )) {
    unique.set(node.slug, node);
  }
  return [...unique.values()];
}

function nodeLink(node: KnowledgeNode, directory: string) {
  return `[${escapeTable(node.title)}](${encodeRepositoryPath(
    `${directory}/nodes/${node.slug}.md`,
  )})`;
}

function nodeListItem(node: KnowledgeNode, directory: string) {
  const topicTitle = node.title?.trim() || "Untitled topic";
  return `- ${nodeLink({ ...node, title: topicTitle }, directory)}`;
}

export function generateKnowledgeReadme(
  nodes: KnowledgeNode[],
  directory = "knowledge",
  portalUrl?: string,
) {
  const active = uniqueByMarkdownPath(
    nodes.filter((node) => !node.archived),
  );
  const sections = new Map<string, KnowledgeNode[]>();

  for (const node of active) {
    const memberships = node.sections.length ? node.sections : ["Unsorted"];
    for (const section of memberships) {
      sections.set(section, [...(sections.get(section) ?? []), node]);
    }
  }

  const sectionEntries = [...sections.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const body = sectionEntries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([section, sectionNodes]) => `## ${escapeTable(section)}

${sectionNodes
  .sort((left, right) => left.title.localeCompare(right.title))
  .map((node) => nodeListItem(node, directory))
  .join("\n")}
`,
    )
    .join("\n\n");
  const generatedAt = new Date().toISOString();

  return `<div align="center">

# 🧠 KnowlegeGraph

**A searchable, version-controlled map of everything you learn.**

![Knowledge nodes](https://img.shields.io/badge/knowledge_nodes-${active.length}-176b4d?style=flat-square)
![Sections](https://img.shields.io/badge/sections-${sectionEntries.length}-315f52?style=flat-square)
![Storage](https://img.shields.io/badge/storage-Markdown-d89b4a?style=flat-square)

</div>

> This repository is generated by the KnowlegeGraph browser extension.
> IndexedDB remains the offline-first working database.

${body || "_No knowledge nodes have been synced yet._"}

---

<sub>Last synchronized ${generatedAt}. Generated automatically—edit knowledge in
the extension so local data and repository history stay consistent.</sub>
`;
}
