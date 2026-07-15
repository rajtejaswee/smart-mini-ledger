import { z } from "zod";

// Normalize email (trim + lowercase) BEFORE validating, so "  Me@X.com " works.
const email = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email("Enter a valid email address")
);

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
