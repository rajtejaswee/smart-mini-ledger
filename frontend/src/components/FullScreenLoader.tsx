import { Loader2 } from "lucide-react";

export function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Loader2 className="size-6 animate-spin text-muted" aria-label="Loading" />
    </div>
  );
}
