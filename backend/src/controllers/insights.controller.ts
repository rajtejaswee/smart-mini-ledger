import type { Request, Response } from "express";
import * as insights from "../services/insights.service";

export async function confidence(req: Request, res: Response): Promise<void> {
  res.json(await insights.checkConfidence(req.userId as string, req.body));
}

export async function burn(req: Request, res: Response): Promise<void> {
  res.json(await insights.getBurn(req.userId as string));
}

export async function velocity(req: Request, res: Response): Promise<void> {
  res.json(await insights.getVelocity(req.userId as string));
}

export async function replay(req: Request, res: Response): Promise<void> {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  res.json(await insights.getReplay(req.userId as string, month));
}
