import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { api, apiError, apiCode } from "@/lib/api";
import type { Transaction, TransactionType } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast } from "@/context/ToastContext";

interface ConfidenceResult {
  unusual: boolean;
  average: number | null;
  suggestedAmount?: number | null;
}

const EXPENSE_CATS = ["Food", "Groceries", "Rent", "Travel", "Entertainment", "Utilities"];
const INCOME_CATS = ["Salary", "Freelance", "Investment", "Gift"];

const today = () => new Date().toISOString().slice(0, 10);

export function AddTransactionModal({
  open,
  onClose,
  reload,
}: {
  open: boolean;
  onClose: () => void;
  reload: () => void;
}) {
  const toast = useToast();

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());

  const [confidence, setConfidence] = useState<ConfidenceResult | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amount);
  const valid = amountNum > 0 && category.trim().length > 0;

  function reset() {
    setType("EXPENSE");
    setAmount("");
    setCategory("");
    setNote("");
    setDate(today());
    setConfidence(null);
    setPendingDuplicate(false);
    setError("");
  }

  function close() {
    reset();
    onClose();
  }

  // Debounced "is this amount unusual?" check against the category average.
  useEffect(() => {
    if (!valid) {
      setConfidence(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await api.post<ConfidenceResult>("/insights/confidence", {
          amount: amountNum,
          type,
          category: category.trim(),
        });
        setConfidence(res.data);
      } catch {
        setConfidence(null);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [amount, category, type, valid, amountNum]);

  async function submit(force = false) {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post<{ transaction: Transaction }>("/transactions", {
        amount: amountNum,
        type,
        category: category.trim(),
        note: note.trim() || undefined,
        date,
        force,
      });
      const tx = res.data.transaction;
      reload();
      close();
      toast.show({
        title: "Transaction added",
        description: `${type === "INCOME" ? "+" : "−"}${formatMoney(tx.amount)} · ${tx.category}`,
        duration: 8000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await api.delete(`/transactions/${tx.id}`);
              reload();
              toast.show({ title: "Transaction removed" });
            } catch {
              /* ignore */
            }
          },
        },
      });
    } catch (err) {
      if (apiCode(err) === "POSSIBLE_DUPLICATE") {
        setPendingDuplicate(true);
      } else {
        setError(apiError(err, "Could not add transaction"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(false);
  }

  const cats = type === "INCOME" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <Modal open={open} onClose={close} title="Add transaction">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-btn border border-line bg-white/5 p-1">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-[9px] py-2 text-sm font-semibold transition-colors duration-200",
                type === t
                  ? t === "INCOME"
                    ? "bg-income/15 text-income"
                    : "bg-expense/15 text-expense"
                  : "text-muted hover:text-ink"
              )}
            >
              {t === "INCOME" ? "Income" : "Expense"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium text-ink">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              ₹
            </span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tnum h-11 w-full rounded-input border border-line bg-card pl-8 pr-3.5 text-sm text-ink transition-shadow duration-200 placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>
        </div>

        {/* Confidence warning */}
        {confidence?.unusual && (
          <div className="flex items-start gap-2 rounded-input border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning animate-fade">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>
                This looks unusual
                {confidence.average != null && (
                  <> — your average for {category.trim()} is {formatMoney(confidence.average)}.</>
                )}
              </p>
              {confidence.suggestedAmount != null && (
                <button
                  type="button"
                  onClick={() => setAmount(String(confidence.suggestedAmount))}
                  className="mt-1 font-semibold text-warning underline underline-offset-2"
                >
                  Did you mean {formatMoney(confidence.suggestedAmount)}?
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-ink">
            Category
          </label>
          <input
            id="category"
            placeholder="e.g. Food"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-input border border-line bg-card px-3.5 text-sm text-ink transition-shadow duration-200 placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            required
          />
          <div className="mt-1 flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-pill border px-2.5 py-1 text-xs font-medium transition-colors duration-200",
                  category === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line text-muted hover:border-primary/40 hover:text-ink"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Note + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="note" className="text-sm font-medium text-ink">
              Note <span className="text-muted">(optional)</span>
            </label>
            <input
              id="note"
              placeholder="—"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11 w-full rounded-input border border-line bg-card px-3.5 text-sm text-ink transition-shadow duration-200 placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-sm font-medium text-ink">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-input border border-line bg-card px-3.5 text-sm text-ink transition-shadow duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* Duplicate confirmation */}
        {pendingDuplicate ? (
          <div className="rounded-input border border-warning/30 bg-warning/10 p-3.5 animate-fade">
            <p className="flex items-start gap-2 text-sm text-warning">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              This looks like a transaction you just added. Add it anyway?
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPendingDuplicate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                loading={submitting}
                onClick={() => submit(true)}
                className="flex-1"
              >
                Add anyway
              </Button>
            </div>
          </div>
        ) : (
          <Button type="submit" size="lg" loading={submitting} disabled={!valid} className="mt-1 w-full">
            Add transaction
          </Button>
        )}
      </form>
    </Modal>
  );
}
