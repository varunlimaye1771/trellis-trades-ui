import { useDashboardSummary } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct } from "@/utils/format";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color?: "profit" | "loss" | "info" | "warning";
}) {
  return (
    <div className="rounded-lg bg-card p-5 shadow-sm border border-border animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className={cn("text-2xl font-bold mt-1 tracking-tight", color === "profit" && "text-profit", color === "loss" && "text-loss")}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color === "profit" && "bg-profit/10 text-profit", color === "loss" && "bg-loss/10 text-loss", color === "info" && "bg-info/10 text-info", color === "warning" && "bg-warning/10 text-warning")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground text-sm mt-1">Your trading overview at a glance.</p>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6">
          <ErrorCard message={error?.message || "Failed to load dashboard"} retryFn={refetch} />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard
            label="Total P&L"
            value={formatINR(data.total_pnl ?? 0)}
            sub={formatPct(data.total_pnl_pct ?? 0)}
            icon={data.total_pnl >= 0 ? TrendingUp : TrendingDown}
            color={data.total_pnl >= 0 ? "profit" : "loss"}
          />
          <StatCard
            label="Open Positions"
            value={String(data.open_positions ?? 0)}
            sub={`${formatINR(data.deployed_capital ?? 0)} deployed`}
            icon={BarChart3}
            color="info"
          />
          <StatCard
            label="Win Rate"
            value={formatPct(data.win_rate ?? 0, false)}
            sub={`${data.total_trades ?? 0} total trades`}
            icon={Target}
            color="warning"
          />
          <StatCard
            label="Unrealised P&L"
            value={formatINR(data.unrealised_pnl ?? 0)}
            icon={data.unrealised_pnl >= 0 ? TrendingUp : TrendingDown}
            color={(data.unrealised_pnl ?? 0) >= 0 ? "profit" : "loss"}
          />
        </div>
      )}
    </div>
  );
}
