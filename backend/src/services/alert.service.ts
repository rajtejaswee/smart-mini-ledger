import type { Transaction, User } from "@prisma/client";
import { prisma } from "../config/db";
import { checkConfidence } from "./insights.service";
import { sendMail, isEmailConfigured } from "./email.service";
import { highSpendAlertEmail } from "../utils/emailTemplates";

/**
 * High-spend alert. Reuses the Confidence engine as the trigger rather than a fixed
 * rupee threshold, so "high" means high *for you, in this category* — ₹4,000 on coffee
 * is alarming, ₹4,000 on rent is a Tuesday.
 */

// Confidence flags both unusually large AND unusually small amounts; only the large
// side is worth an email.
const ALERT_RATIO = 3;

export interface AlertDecision {
  send: boolean;
  reason: string;
  average?: number;
  ratio?: number;
}

/**
 * Pure-ish decision step, kept separate from delivery so it can be tested directly.
 * MUST run BEFORE the transaction is inserted: checkConfidence averages every row in
 * the category, so a saved transaction would dilute its own baseline and hide the spike.
 */
export async function shouldAlert(
  userId: string,
  input: { amount: number; type: "INCOME" | "EXPENSE"; category: string }
): Promise<AlertDecision> {
  // An unusually large *income* is good news; never alert on it.
  if (input.type !== "EXPENSE") return { send: false, reason: "not an expense" };

  const c = await checkConfidence(userId, input);
  if (!c.unusual) return { send: false, reason: c.reason ?? "within normal range" };
  if (c.ratio == null || c.ratio < ALERT_RATIO) {
    return { send: false, reason: "unusually small, not a spike" };
  }

  return {
    send: true,
    reason: `${c.ratio}x the ${input.category} average`,
    average: c.average ?? undefined,
    ratio: c.ratio,
  };
}

/**
 * Fire-and-forget delivery. Never throws and never blocks the caller's response —
 * the transaction is already saved by the time this runs.
 */
export async function sendHighSpendAlert(
  user: Pick<User, "id" | "email" | "name" | "emailAlerts">,
  txn: Transaction,
  decision: AlertDecision
): Promise<boolean> {
  if (!user.emailAlerts) return false;
  if (!isEmailConfigured()) return false;

  const { subject, html, text } = highSpendAlertEmail({
    name: user.name,
    amount: txn.amount,
    category: txn.category,
    note: txn.note,
    date: txn.date,
    average: decision.average,
    ratio: decision.ratio,
  });

  return sendMail({ to: user.email, subject, html, text });
}

/**
 * The whole alert path in one call, for the create-transaction controller to fire off.
 * Swallows everything: an alert failure must never surface to the user.
 */
export async function runHighSpendAlert(
  userId: string,
  txn: Transaction,
  decision: AlertDecision
): Promise<void> {
  try {
    if (!decision.send) return;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailAlerts: true },
    });
    if (!user) return;
    await sendHighSpendAlert(user, txn, decision);
  } catch (err) {
    console.error("[alert] high-spend alert failed:", err instanceof Error ? err.message : err);
  }
}
