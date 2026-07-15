import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-[10px] bg-neutral-900 text-white shadow-soft">
        <Wallet className="size-4.5" strokeWidth={2.25} />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">Ledger</span>
    </div>
  );
}
