import { useState } from "react";
import type {
  KnowledgeNode,
  NodeDraft,
  PendingCapture,
} from "@/domain/knowledge-node/model";
import { EMPTY_NODE_DRAFT } from "@/domain/knowledge-node/model";
import { saveNode } from "@/infrastructure/storage/node-repository";
import { getDomain } from "@/shared/lib/url";
import { ChipInput } from "@/shared/ui/ChipInput";
import { Arrow, External, Spark, X } from "@/shared/ui/icons";
import { nodeSchema } from "../model/node-validation";

interface CaptureFormProps {
  existing?: KnowledgeNode;
  initialCapture?: PendingCapture;
  onSaved: () => void;
  onCancel?: () => void;
}

function createInitialDraft(
  existing?: KnowledgeNode,
  capture?: PendingCapture,
): NodeDraft {
  if (existing) {
    const {
      id: _id,
      slug: _slug,
      archived: _archived,
      favorite: _favorite,
      createdAt: _created,
      updatedAt: _updated,
      ...editable
    } = existing;
    return editable;
  }

  if (!capture) return EMPTY_NODE_DRAFT;

  return {
    ...EMPTY_NODE_DRAFT,
    title: capture.title,
    summary: capture.selectedText ?? "",
    resources: capture.url
      ? [
          {
            url: capture.url,
            title: capture.title,
            type: "article",
            website: getDomain(capture.url),
          },
        ]
      : [],
  };
}

export function CaptureForm({
  existing,
  initialCapture,
  onSaved,
  onCancel,
}: CaptureFormProps) {
  const [draft, setDraft] = useState<NodeDraft>(() =>
    createInitialDraft(existing, initialCapture),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const resource = draft.resources[0];

  function update<K extends keyof NodeDraft>(key: K, value: NodeDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = nodeSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    await saveNode(draft, existing);
    setSaving(false);
    onSaved();
  }

  return (
    <form className="capture-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">
            {existing ? "Refine your knowledge" : "New knowledge node"}
          </span>
          <h1>{existing ? "Edit node" : "Capture what matters"}</h1>
        </div>
        {onCancel && (
          <button
            type="button"
            className="icon-button"
            onClick={onCancel}
            aria-label="Close"
          >
            <X />
          </button>
        )}
      </div>

      {resource?.url && (
        <div className="page-card">
          <div className="favicon">
            {getDomain(resource.url).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{getDomain(resource.url)}</strong>
            <span>{resource.url}</span>
          </div>
          <External />
        </div>
      )}

      <label>
        <span>Title</span>
        <input
          autoFocus
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="What did you learn?"
        />
        {error && <small className="error">{error}</small>}
      </label>
      <label>
        <span>
          Summary <em>optional</em>
        </span>
        <textarea
          rows={3}
          value={draft.summary}
          onChange={(event) => update("summary", event.target.value)}
          placeholder="The idea in your own words…"
        />
      </label>
      <div className="field-row">
        <label>
          <span>Sections</span>
          <ChipInput
            values={draft.sections}
            onChange={(values) => update("sections", values)}
            placeholder="HLD, Backend"
            ariaLabel="Add sections"
          />
        </label>
        <label>
          <span>Tags</span>
          <ChipInput
            values={draft.tags}
            onChange={(values) => update("tags", values)}
            placeholder="interview, read"
            ariaLabel="Add tags"
          />
        </label>
      </div>
      <label>
        <span>Keywords</span>
        <ChipInput
          values={draft.keywords}
          onChange={(values) => update("keywords", values)}
          placeholder="consistency, availability, partitions"
          ariaLabel="Add keywords"
        />
      </label>
      <label>
        <span>
          Notes <em>Markdown supported</em>
        </span>
        <textarea
          className="notes"
          rows={5}
          value={draft.notes}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Add context, questions, or your own examples…"
        />
      </label>
      <div className="form-actions">
        <div className="hint">
          <Spark /> Saved locally, always.
        </div>
        <button className="primary" disabled={saving}>
          {saving
            ? "Saving…"
            : existing
              ? "Save changes"
              : "Add to graph"}{" "}
          <Arrow />
        </button>
      </div>
    </form>
  );
}
