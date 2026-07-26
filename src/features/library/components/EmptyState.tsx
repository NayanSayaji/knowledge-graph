import { Network, Plus } from "@/shared/ui/icons";

interface EmptyStateProps {
  onCapture: () => void;
}

export function EmptyState({ onCapture }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-orbit">
        <Network />
      </div>
      <h2>Your graph starts here</h2>
      <p>
        Capture an idea, article, or concept. The connections will grow with you.
      </p>
      <button className="primary" onClick={onCapture}>
        <Plus /> Capture your first node
      </button>
    </section>
  );
}
