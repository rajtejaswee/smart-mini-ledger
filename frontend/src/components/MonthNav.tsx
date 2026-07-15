import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/month";

export function MonthNav({
  month,
  onPrev,
  onNext,
  canNext,
}: {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous month"
        className="grid size-9 place-items-center rounded-btn border border-line bg-card text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[8.5rem] text-center text-sm font-semibold text-ink">
        {monthLabel(month)}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next month"
        className="grid size-9 place-items-center rounded-btn border border-line bg-card text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
