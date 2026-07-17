/**
 * Seed the public demo account (demo@ledger.app / demo1234) with ~2 months of
 * realistic data so every dashboard widget is alive on first login.
 *
 * Idempotent: if the demo user already has transactions, it exits untouched.
 * Run:  npx tsx prisma/seed.ts          (uses DATABASE_URL from the environment)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@ledger.app";
const DEMO_PASSWORD = "demo1234";

// [category, type, base amount, roughly-every-N-days]
const RECURRING: Array<["INCOME" | "EXPENSE", string, number, number]> = [
  ["INCOME", "salary", 62500, 30],
  ["EXPENSE", "rent", 15000, 30],
  ["EXPENSE", "groceries", 2400, 6],
  ["EXPENSE", "food", 420, 2],
  ["EXPENSE", "travel", 240, 4],
  ["EXPENSE", "utilities", 1100, 15],
  ["EXPENSE", "entertainment", 650, 9],
];

// Deterministic pseudo-random so the demo looks organic but seeds identically.
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo", passwordHash, monthlyIncome: 62500 },
  });

  const existing = await prisma.transaction.count({
    where: { userId: user.id, isDeleted: false },
  });
  if (existing > 0) {
    console.log(`Demo user already has ${existing} transactions — nothing to do.`);
    return;
  }

  const rand = mulberry32(20260717);
  const now = new Date();
  const data: {
    userId: string; amount: number; type: "INCOME" | "EXPENSE";
    category: string; date: Date; note?: string;
  }[] = [];

  for (const [type, category, base, everyDays] of RECURRING) {
    for (let daysAgo = 60; daysAgo >= 0; daysAgo -= everyDays) {
      // jitter timing ±1 day and amount ±20% so charts look human
      const jitterDays = Math.floor(rand() * 2);
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo - jitterDays, 12);
      if (date > now) continue;
      const amount = Math.round(base * (0.8 + rand() * 0.4) * 100) / 100;
      data.push({ userId: user.id, amount, type, category, date });
    }
  }

  await prisma.transaction.createMany({ data });
  console.log(`Seeded ${data.length} transactions for ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
