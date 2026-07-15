import { prisma } from "../config/db";
import { ApiError } from "../middlewares/errorHandler";
import type { CreateTransactionInput } from "../validators/transaction.schema";

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  return prisma.transaction.create({
    data: {
      userId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      note: input.note,
      date: input.date ?? new Date(),
    },
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
