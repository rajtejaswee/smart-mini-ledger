import { Button } from "@/components/ui/Button";

// Shared "couldn't load" card with a retry — an API failure must never be
// mistaken for an empty state.
export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="grid place-items-center rounded-card border border-line bg-card py-20 text-center shadow-soft animate-rise">
      <div>
        <p className="text-sm font-medium text-ink">Couldn&rsquo;t load your {what}</p>
        <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
