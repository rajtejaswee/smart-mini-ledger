import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
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
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
