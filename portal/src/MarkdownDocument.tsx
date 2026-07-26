import { useEffect, useMemo, useRef } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

function withoutFrontmatter(markdown: string) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
}

export function MarkdownDocument({ markdown }: { markdown: string }) {
  const root = useRef<HTMLDivElement>(null);
  const html = useMemo(
    () =>
      DOMPurify.sanitize(
        marked.parse(withoutFrontmatter(markdown), {
          async: false,
          gfm: true,
          breaks: false,
        }) as string,
      ),
    [markdown],
  );

  useEffect(() => {
    if (!root.current) return;
    const headings = root.current.querySelectorAll("h2, h3");
    headings.forEach((heading, index) => {
      heading.id =
        heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `heading-${index}`;
    });

    void import("highlight.js").then(({ default: hljs }) => {
      root.current?.querySelectorAll<HTMLElement>("pre code").forEach((code) => {
        if (code.classList.contains("language-mermaid")) return;
        hljs.highlightElement(code);
        const pre = code.parentElement;
        if (!pre || pre.querySelector("button")) return;
        const button = document.createElement("button");
        button.className = "copy-code";
        button.textContent = "Copy";
        button.onclick = async () => {
          await navigator.clipboard.writeText(code.textContent ?? "");
          button.textContent = "Copied";
          setTimeout(() => (button.textContent = "Copy"), 1_200);
        };
        pre.append(button);
      });
    });

    void import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      root.current?.querySelectorAll<HTMLElement>("code.language-mermaid").forEach(async (code, index) => {
        const pre = code.parentElement;
        if (!pre) return;
        try {
          const rendered = await mermaid.render(`kg-mermaid-${Date.now()}-${index}`, code.textContent ?? "");
          const wrapper = document.createElement("div");
          wrapper.className = "mermaid-diagram";
          wrapper.innerHTML = DOMPurify.sanitize(rendered.svg, { USE_PROFILES: { svg: true } });
          pre.replaceWith(wrapper);
        } catch {
          pre.classList.add("mermaid-error");
        }
      });
    });
  }, [html]);

  return <div ref={root} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
