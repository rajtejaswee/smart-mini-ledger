import { z } from "zod";

// Body for the pre-save "is this amount unusual?" check.
export const confidenceSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1_000_000_000, "Amount is too large"),
  type: z.enum(["INCOME", "EXPENSE"]),
  // Same cap as the create-transaction schema — no reason to accept a longer
  // category here than we'd ever store.
  category: z.string().trim().min(1, "Category is required").max(40, "Category is too long"),
});

export type ConfidenceInput = z.infer<typeof confidenceSchema>;
