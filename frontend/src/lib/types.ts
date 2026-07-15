export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyIncome: number | null;
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
