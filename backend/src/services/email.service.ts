import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";

/**
 * Thin Nodemailer wrapper. Two rules hold everywhere in here:
 *   1. Email is optional — with no credentials configured the app runs fine, silently.
 *   2. Sending never throws. A dead SMTP box must not turn a saved transaction into a 500.
 */

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(env.email.user && env.email.appPassword);
}

// Built once, lazily — no connection is opened at import time.
function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.email.user, pass: env.email.appPassword },
    });
  }
  return transporter;
}

// Lets tests (and a future queue) swap in a transport without touching callers.
export function setTransporter(t: Transporter | null): void {
  transporter = t;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Returns true if the mail was handed to SMTP, false if skipped or failed. Never throws. */
export async function sendMail(mail: MailInput): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) {
    console.warn("[email] not configured — skipping:", mail.subject);
    return false;
  }

  try {
    await tx.sendMail({ from: env.email.from, ...mail });
    console.log(`[email] sent "${mail.subject}" to ${mail.to}`);
    return true;
  } catch (err) {
    // Swallow: the caller's real work already succeeded.
    console.error("[email] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
