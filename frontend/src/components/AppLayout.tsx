import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { Logo } from "./ui/Logo";
import { Button } from "./ui/Button";

export function AppLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-dvh bg-plane">
      <AppSidebar />

      {/* Mobile top bar (sidebar is desktop-only) */}
      <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3 lg:hidden">
        <Logo />
        <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
