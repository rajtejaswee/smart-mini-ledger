import { prisma } from "../config/db";
import { ApiError } from "../middlewares/errorHandler";
import { shouldAlert, runHighSpendAlert } from "./alert.service";
import type { AlertDecision } from "./alert.service";
import type { CreateTransactionInput } from "../validators/transaction.schema";

// Two entries with the same amount + type + category recorded within this window
// are almost certainly an accidental double-submit.
const DUPLICATE_WINDOW_MS = 30_000;

async function findRecentDuplicate(
  userId: string,
  data: { amount: number; type: "INCOME" | "EXPENSE"; category: string }
) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  return prisma.transaction.findFirst({
    where: {
      userId,
      isDeleted: false,
      amount: data.amount,
      type: data.type,
      category: data.category,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const { force, ...data } = input;

  if (!force) {
    const duplicate = await findRecentDuplicate(userId, data);
    if (duplicate) {
      throw new ApiError(
        409,
        "This looks like a transaction you just added. Add it anyway?",
        {
          existing: {
            id: duplicate.id,
            amount: duplicate.amount,
            type: duplicate.type,
            category: duplicate.category,
            note: duplicate.note,
            createdAt: duplicate.createdAt,
          },
        },
        "POSSIBLE_DUPLICATE"
      );
    }
  }

  // Decide BEFORE inserting: checkConfidence averages every row in the category, so
  // saving first would let this transaction dilute the baseline it's measured against.
  const decision = await shouldAlert(userId, data);

  const txn = await prisma.transaction.create({
    data: {
      userId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      note: data.note,
      date: data.date ?? new Date(),
    },
  });

  // Fire-and-forget: SMTP latency must not slow the 201, and a bounce must not fail it.
  // `void` is deliberate — runHighSpendAlert swallows its own errors.
  void runHighSpendAlert(userId, txn, decision);

  return txn;
}

// Exported for the alert tests, which need the decision without the insert.
export type { AlertDecision };

// Undo support: bring back a soft-deleted transaction (used by the 10s Undo toast).
export async function restoreTransaction(userId: string, id: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, isDeleted: true },
  });
  if (!existing) throw new ApiError(404, "Transaction not found or not deleted");

  return prisma.transaction.update({
    where: { id },
    data: { isDeleted: false },
  });
}

export async function listTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId, isDeleted: false },
    orderBy: { date: "desc" },
  });
}

export async function softDeleteTransaction(userId: string, id: string) {
  // Scope the lookup to the owner so users can't delete others' transactions.
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, isDeleted: false },
  });
  if (!existing) throw new ApiError(404, "Transaction not found");

  return prisma.transaction.update({
    where: { id },
    data: { isDeleted: true },
  });
}

export async function getSummary(userId: string) {
  const grouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, isDeleted: false },
    _sum: { amount: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of grouped) {
    if (row.type === "INCOME") totalIncome = row._sum.amount ?? 0;
    else totalExpense = row._sum.amount ?? 0;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    balance: round2(totalIncome - totalExpense),
  };
}
