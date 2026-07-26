import { describe, expect, it } from "vitest";
import { getPortalTemplateChanges } from "./template";

describe("documentation portal template", () => {
  it("ships a complete static site and configured Pages workflow", () => {
    const changes = getPortalTemplateChanges("developer-notes", "release/docs");
    const paths = changes.map((change) => change.path);
    const workflow = changes.find((change) =>
      change.path.includes("deploy-knowledge-portal"),
    )?.content;

    expect(paths).toContain("portal/src/App.tsx");
    expect(paths).toContain("portal/src/MarkdownDocument.tsx");
    expect(paths).toContain("portal/package-lock.json");
    expect(workflow).toContain('"developer-notes/**"');
    expect(workflow).toContain(
      'cp -R "developer-notes" portal/public/knowledge',
    );
    expect(workflow).toContain('branches: ["release/docs"]');
    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).not.toContain("__KNOWLEDGE_DIRECTORY__");
  });

  it("rejects unsafe workflow path interpolation", () => {
    expect(() => getPortalTemplateChanges('knowledge"\necho unsafe')).toThrow(
      "cannot be used in the Pages workflow",
    );
  });

  it("rejects unsafe workflow branch interpolation", () => {
    expect(() =>
      getPortalTemplateChanges("knowledge", 'main"]\necho unsafe'),
    ).toThrow("sync branch contains characters");
  });
});
