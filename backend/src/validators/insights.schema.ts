import { z } from "zod";

// Body for the pre-save "is this amount unusual?" check.
export const confidenceSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(1, "Category is required"),
});

export type ConfidenceInput = z.infer<typeof confidenceSchema>;
