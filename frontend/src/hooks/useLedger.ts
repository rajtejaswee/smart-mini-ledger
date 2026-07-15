import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import { addMonths, startOfMonth, isSameMonth } from "@/lib/month";

// Shared data + month navigation for the Timeline and Calendar pages.
export function useLedger() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const load = useCallback(async () => {
    const res = await api.get<{ transactions: Transaction[] }>("/transactions");
    setTxns(res.data.transactions);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const prev = () => setMonth((m) => addMonths(m, -1));
  const next = () => setMonth((m) => addMonths(m, 1));
  const canNext = !isSameMonth(month, startOfMonth(new Date()));

  return { txns, loading, load, month, prev, next, canNext };
}
