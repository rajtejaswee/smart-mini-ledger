import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    // ₹100 crore cap: keeps 2dp rounding (n * 100) and long-run aggregates far
    // from Float overflow — 1e308 would round to Infinity and 500 on insert.
    .max(1_000_000_000, "Amount is too large")
    // Money: keep to 2 decimals so floating-point noise never reaches the DB.
    .transform((n) => Math.round(n * 100) / 100),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(40, "Category is too long"),
  note: z.string().trim().max(200, "Note is too long").optional(),
  // Accepts an ISO string or Date; defaults to "now" in the service if omitted.
  date: z.coerce.date().optional(),
  // When true, skip the duplicate guard ("Add anyway?" confirmed by the user).
  force: z.boolean().optional().default(false),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
