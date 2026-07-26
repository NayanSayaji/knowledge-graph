# Knowledge Graph documentation portal

Every successful GitHub sync now maintains a complete static documentation
website alongside the portable Markdown backup. The portal is a separate
React, TypeScript, and Vite application in `portal/`; it never reads the
generated root README as content.

## Data pipeline

```text
IndexedDB knowledge nodes
  -> knowledge/nodes/*.md       canonical rendered topic content
  -> knowledge/graph.json       relationships and restore metadata
  -> knowledge/sections.json    generated navigation index
  -> knowledge/stats.json       generated aggregate analytics
  -> portal/                    static React/Vite application
  -> GitHub Actions
  -> GitHub Pages
```

Markdown remains the human-readable topic source. `sections.json` and
`stats.json` are derived on every sync and contain no independently editable
content.

## Routes

The portal uses hash routes so direct navigation works on GitHub Pages without
server-side rewrites:

| Route | Purpose |
| --- | --- |
| `#/` | Landing page, counts, sections, and recent topics |
| `#/topic/:slug` | Markdown topic, resources, and related nodes |
| `#/section/:name` | Alphabetical section browser with local search |
| `#/search` | Instant Fuse.js search across all node fields |
| `#/graph` | Zoomable relationship visualization with highlighting |
| `#/timeline` | Learning activity grouped by creation month |
| `#/stats` | Resource, tag, relationship, and connection analytics |

The global search is available from every route. Pressing `/` focuses it.

## Markdown rendering

Topic routes fetch `knowledge/nodes/<slug>.md`, remove generated front matter,
sanitize rendered HTML, and support:

- headings, anchor targets, lists, links, tables, images, and task lists;
- fenced code with syntax highlighting, language classes, and copy controls;
- Mermaid fenced blocks rendered as diagrams;
- GitHub-flavored Markdown and footnotes supported by the parser.

Rendering dependencies are loaded only when a topic is opened so the landing
page does not pay the Mermaid bundle cost.

## Themes and responsiveness

Light, dark, and system themes are available in the header. The selected value
is stored only in browser local storage. The persistent desktop sidebar becomes
a compact horizontal navigation bar on smaller screens, while topic sidebars
move below their content.

## GitHub Pages deployment

KnowlegeGraph writes
`.github/workflows/deploy-knowledge-portal.yml` into the generated repository.
On every synchronized knowledge or portal change, the workflow:

1. installs the locked portal dependencies;
2. copies the configured knowledge directory to `portal/public/knowledge`;
3. builds the static Vite application;
4. uploads `portal/dist`;
5. deploys the artifact through GitHub Pages.

For the first deployment, open the generated repository's **Settings → Pages**
and select **GitHub Actions** as the source if GitHub has not enabled it
automatically. Private-repository Pages availability depends on the repository
owner's GitHub plan.

The fine-grained token must include **Workflows: read and write** in addition to
the existing Contents permission because each sync maintains the Pages workflow
under `.github/workflows/`. Tokens created before the portal feature must be
edited or replaced before the first portal sync.

## Local development

The source template can be developed inside this repository:

```bash
npm run dev:portal
npm run build:portal
```

Development mode uses representative preview nodes when generated files are not
available. Production builds never include that fallback as a data source.
