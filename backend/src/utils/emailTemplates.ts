import { env } from "../config/env";

// ₹ formatting for emails (server-side, so we can't reuse the frontend helper).
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const longDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Emails can't use our stylesheet — clients strip <style>, so everything is inline.
// Table layout + hex colours is the boring choice that actually renders in Gmail.
const BRAND = "#0B0B0F";
const ACCENT = "#41EAD4";
const INK = "#1A1A1F";
const MUTED = "#6B6B76";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface HighSpendEmailInput {
  name: string;
  amount: number;
  category: string;
  note: string | null;
  date: Date;
  average?: number;
  ratio?: number;
}

export function highSpendAlertEmail(input: HighSpendEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const amount = inr.format(input.amount);
  const category = escapeHtml(input.category);
  const firstName = escapeHtml(input.name.split(" ")[0] ?? input.name);
  const when = longDate.format(input.date);

  const subject = `Unusual spend: ${amount} on ${input.category}`;

  const comparison =
    input.average != null && input.ratio != null
      ? `That's about ${input.ratio}× your usual ${category} spend of ${inr.format(input.average)}.`
      : `That's well above your usual ${category} spend.`;

  const text = [
    `Hi ${input.name.split(" ")[0] ?? input.name},`,
    ``,
    `A transaction just landed that looks unusual for you:`,
    ``,
    `  ${amount} — ${input.category}${input.note ? ` (${input.note})` : ""}`,
    `  ${when}`,
    ``,
    comparison.replace(/×/g, "x"),
    ``,
    `If that was you, no action needed. If it wasn't, open your ledger and remove it:`,
    env.clientUrl,
    ``,
    `You can turn these alerts off in Settings.`,
  ].join("\n");

  const html = `
<div style="margin:0;padding:24px 12px;background:#F4F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="background:${BRAND};padding:20px 28px;">
        <span style="color:#FFFFFF;font-size:16px;font-weight:700;letter-spacing:-0.2px;">Ledger</span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};">Unusual spend</p>
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;font-weight:700;color:${INK};">Hi ${firstName}, this one stood out</h1>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F7F9;border-radius:12px;margin:0 0 20px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0;font-size:28px;font-weight:700;color:${INK};letter-spacing:-0.5px;">${amount}</p>
              <p style="margin:4px 0 0;font-size:14px;color:${INK};text-transform:capitalize;">${category}</p>
              ${input.note ? `<p style="margin:2px 0 0;font-size:13px;color:${MUTED};">${escapeHtml(input.note)}</p>` : ""}
              <p style="margin:8px 0 0;font-size:12px;color:${MUTED};">${when}</p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${INK};">${comparison}</p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">If that was you, nothing to do. If it wasn't, open your ledger and remove it.</p>

        <a href="${env.clientUrl}" style="display:inline-block;background:${ACCENT};color:${BRAND};font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;">Open Ledger</a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 24px;border-top:1px solid #ECECEF;">
        <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">
          You're getting this because high-spend alerts are on. Turn them off any time in
          <a href="${env.clientUrl}/settings" style="color:${MUTED};">Settings</a>.
        </p>
      </td>
    </tr>
  </table>
</div>`.trim();

  return { subject, html, text };
}
