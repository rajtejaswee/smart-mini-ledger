import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarClock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/timeline", label: "Timeline", icon: CalendarClock },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-canvas/90 backdrop-blur-md lg:hidden">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted"
            )
          }
        >
          <it.icon className="size-5" aria-hidden />
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
