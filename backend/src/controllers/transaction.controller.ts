import type { Request, Response } from "express";
import * as service from "../services/transaction.service";

export async function create(req: Request, res: Response): Promise<void> {
  const transaction = await service.createTransaction(req.userId as string, req.body);
  res.status(201).json({ transaction });
}

export async function list(req: Request, res: Response): Promise<void> {
  const transactions = await service.listTransactions(req.userId as string);
  res.json({ transactions });
}

export async function summary(req: Request, res: Response): Promise<void> {
  const data = await service.getSummary(req.userId as string);
  res.json({ summary: data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const transaction = await service.softDeleteTransaction(
    req.userId as string,
    req.params.id as string
  );
  res.json({ transaction });
}

export async function restore(req: Request, res: Response): Promise<void> {
  const transaction = await service.restoreTransaction(
    req.userId as string,
    req.params.id as string
  );
  res.json({ transaction });
}
