import type { ReactNode } from "react";
import { Wallet, Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const features = [
  "Smart anomaly & duplicate detection",
  "Spending DNA & burn-rate insights",
  "Timeline & calendar heatmap views",
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#06110e] via-[#0a1512] to-[#0c0f0a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-expense/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="glass grid size-9 place-items-center rounded-[11px] text-white">
            <Wallet className="size-5" strokeWidth={2.25} />
          </span>
          <span className="text-xl font-bold tracking-tight">Ledger</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight">
            Money, beautifully in order.
          </h2>
          <p className="mt-4 text-white/60">
            Track every rupee, catch unusual spends before they cost you, and see your
            whole month at a glance.
          </p>
        </div>

        <ul className="relative space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-white/75">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10">
                <Check className="size-3.5 text-primary" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[380px] animate-rise">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
      </div>
    </main>
  );
}
