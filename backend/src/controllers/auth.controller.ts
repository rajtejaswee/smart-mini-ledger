import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword as changeUserPassword,
} from "../services/auth.service";

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await getCurrentUser(req.userId as string);
  res.json({ user });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = await updateProfile(req.userId as string, req.body);
  res.json({ user });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await changeUserPassword(req.userId as string, req.body);
  res.status(204).send();
}
