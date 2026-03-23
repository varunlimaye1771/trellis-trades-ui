import { NavLink } from "react-router-dom";
import { LayoutDashboard, Search, Briefcase, Clock, TrendingUp, LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { formatINR } from "@/utils/format";
import { useCapital, useHealthCheck } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/screener", label: "Screener", icon: Search },
  { to: "/positions", label: "Positions", icon: Briefcase },
  { to: "/history", label: "History", icon: Clock },
];

export function AppSidebar() {
  const { data: capitalData } = useCapital();
  const { data: health, isError: healthError } = useHealthCheck();
  const { signOut } = useClerk();

  const isOnline = !!health && !healthError;

  return (
    <aside className="hidden md:flex flex-col w-[220px] h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <TrendingUp className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <span className="text-[15px] font-semibold text-sidebar-accent-foreground tracking-tight">
          Trellis Trades
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-4 pb-4 space-y-3 shrink-0">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60 font-medium">
            Current Capital
          </p>
          <p className="text-lg font-semibold text-profit mt-0.5">
            {capitalData ? formatINR(capitalData.current_capital) : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOnline ? "bg-profit" : "bg-loss"
            )}
          />
          <span className="text-xs text-sidebar-foreground/60">
            {isOnline ? "API Online" : "API Offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}
