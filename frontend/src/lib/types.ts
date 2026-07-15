export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyIncome: number | null;
  emailAlerts: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string | null;
  date: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Burn {
  balance: number;
  burnRatePerDay: number;
  daysRemaining: number | null;
  monthExpense: number;
  daysElapsed: number;
  monthlyIncome: number | null;
  netBurnPerDay: number | null;
  sustainable: boolean;
}

export interface Velocity {
  thisWeek: number;
  lastWeek: number;
  changePercent: number | null;
  direction: "up" | "down" | "flat";
}

export interface Replay {
  month: string;
  earned: number;
  spent: number;
  biggestExpense: { amount: number; category: string; date: string } | null;
  topCategory: { category: string; count: number } | null;
  avgDailySpend: number;
  transactionCount: number;
}
