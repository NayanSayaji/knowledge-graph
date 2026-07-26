import type { Resource } from "@/domain/knowledge-node/model";

function sectionBetween(markdown: string, start: string, end: string) {
  const startIndex = markdown.indexOf(start);
  if (startIndex < 0) return "";
  const contentStart = startIndex + start.length;
  const endIndex = markdown.indexOf(end, contentStart);
  const value = markdown
    .slice(contentStart, endIndex < 0 ? undefined : endIndex)
    .trim();
  return /^_No .+ yet\._$/.test(value) ? "" : value;
}

export function parseGeneratedNodeMarkdown(markdown: string) {
  const resourceSection = sectionBetween(
    markdown,
    "## Resources",
    "## Relationships",
  );
  const resources: Resource[] = [];
  for (const line of resourceSection.split("\n")) {
    const match = line.match(
      /^- \[([^\]]+)\]\((.+)\) _\((article|documentation|video|repository|blog|notes)\)_$/,
    );
    if (!match) continue;
    try {
      resources.push({
        title: match[1],
        url: match[2],
        type: match[3] as Resource["type"],
        website: new URL(match[2]).hostname.replace(/^www\./, ""),
      });
    } catch {
      // Skip malformed legacy resource URLs while restoring other node data.
    }
  }

  return {
    summary: sectionBetween(markdown, "## Summary", "## Notes"),
    notes: sectionBetween(markdown, "## Notes", "## Resources"),
    resources,
  };
}
