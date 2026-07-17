import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

// Delete a transaction with an 8s Undo toast (soft delete → restore), shared by
// the Timeline and Calendar rows. Mirrors the add-flow's undo pattern in reverse.
export function useDeleteTransaction(reload: () => void) {
  const toast = useToast();

  return async function deleteTransaction(t: Transaction) {
    try {
      await api.delete(`/transactions/${t.id}`);
      reload();
      toast.show({
        title: "Transaction deleted",
        description: `${t.type === "INCOME" ? "+" : "−"}${formatMoney(t.amount)} · ${t.category}`,
        duration: 8000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await api.post(`/transactions/${t.id}/restore`);
              reload();
              toast.show({ title: "Transaction restored" });
            } catch {
              toast.show({ title: "Couldn't restore transaction" });
            }
          },
        },
      });
    } catch {
      toast.show({ title: "Couldn't delete transaction" });
    }
  };
}
