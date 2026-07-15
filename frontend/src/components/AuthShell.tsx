import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[400px] animate-rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-6" />
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="rounded-card border border-line bg-card p-7 shadow-float">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  );
}
