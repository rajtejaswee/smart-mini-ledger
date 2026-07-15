import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddTransactionModal } from "./AddTransactionModal";

// Header "Add" button (desktop) + floating action button (mobile) + the modal.
export function AddTransactionButton({ reload }: { reload: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="hidden sm:inline-flex">
        <Plus className="size-4" />
        Add transaction
      </Button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className="neon-primary fixed bottom-20 right-5 z-30 grid size-14 place-items-center rounded-pill transition-transform duration-200 hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="size-6" />
      </button>

      <AddTransactionModal open={open} onClose={() => setOpen(false)} reload={reload} />
    </>
  );
}
