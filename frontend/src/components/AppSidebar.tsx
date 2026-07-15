import { LayoutDashboard, ArrowLeftRight, Sparkles, Settings, LogOut, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  soon?: boolean;
}

// Dashboard is live; the rest are scaffolded for upcoming phases.
const nav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Transactions", icon: ArrowLeftRight, soon: true },
  { label: "Insights", icon: Sparkles, soon: true },
  { label: "Settings", icon: Settings, soon: true },
];

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-sidebar px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-white shadow-soft">
          <Wallet className="size-4.5" strokeWidth={2.25} />
        </span>
        <span className="text-lg font-bold tracking-tight text-white">Ledger</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-current={item.active ? "page" : undefined}
            aria-disabled={item.soon}
            className={cn(
              "group flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              item.active
                ? "bg-white/10 text-white"
                : "text-sidebar-muted hover:bg-white/5 hover:text-white",
              item.soon && "cursor-default"
            )}
          >
            <item.icon className="size-4.5" aria-hidden />
            <span className="flex-1 text-left">{item.label}</span>
            {item.soon && (
              <span className="rounded-pill bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-muted">
                Soon
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <span className="grid size-8 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors duration-200 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4.5" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
