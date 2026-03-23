import { useDashboardData } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ── helpers ── */

function abbreviateINR(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return formatINR(value);
}

/* ── Section 1: Regime Banner ── */

function RegimeBanner({ regime }: { regime: any }) {
  const bull = regime.is_bullish;
  return (
    <div
      className={cn(
        "rounded-md px-4 py-3 text-sm font-medium border-l-[3px] animate-fade-in",
        bull
          ? "bg-profit/15 border-l-profit text-profit"
          : "bg-loss/15 border-l-loss text-loss"
      )}
    >
      {bull ? "Bullish" : "Bearish"} Regime — Nifty at{" "}
      {formatINR(regime.nifty_close)} · 50 EMA at {formatINR(regime.ema50)} ·{" "}
      {bull
        ? "Screener active this week"
        : "Consider skipping this week"}
    </div>
  );
}

/* ── Section 2: Metric Cards ── */

function MetricCards({
  capital,
  performance,
}: {
  capital: any;
  performance: any;
}) {
  const totalReturnPositive = (capital.total_return_pct ?? 0) >= 0;
  const expectancyPositive = (performance.expectancy_inr ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Capital */}
      <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
        <p className="text-sm text-muted-foreground font-medium">Current Capital</p>
        <p className="text-[28px] font-bold tracking-tight mt-1 tabular-nums">
          {formatINR(capital.current_capital)}
        </p>
      </div>

      {/* Total Return */}
      <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
        <p className="text-sm text-muted-foreground font-medium">Total Return</p>
        <p
          className={cn(
            "text-[28px] font-bold tracking-tight mt-1 tabular-nums",
            totalReturnPositive ? "text-profit" : "text-loss"
          )}
        >
          {formatPct(capital.total_return_pct ?? 0)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          from {formatINR(capital.initial_capital ?? 0)}
        </p>
      </div>

      {/* Win Rate */}
      <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
        <p className="text-sm text-muted-foreground font-medium">Win Rate</p>
        <p className="text-[28px] font-bold tracking-tight mt-1 tabular-nums">
          {performance.win_rate_pct ?? 0}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {performance.winning_trades ?? 0}W / {performance.losing_trades ?? 0}L
        </p>
      </div>

      {/* Expectancy */}
      <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
        <p className="text-sm text-muted-foreground font-medium">Expectancy</p>
        <p
          className={cn(
            "text-[28px] font-bold tracking-tight mt-1 tabular-nums",
            expectancyPositive ? "text-profit" : "text-loss"
          )}
        >
          {formatINR(performance.expectancy_inr ?? 0)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">per trade</p>
      </div>
    </div>
  );
}

/* ── Section 3: Equity Curve ── */

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-card border border-border shadow-lg px-3 py-2 text-sm">
      <p className="font-medium">{formatDate(d.date)}</p>
      <p className="tabular-nums text-profit">{formatINR(d.capital)}</p>
      {d.note && <p className="text-muted-foreground text-xs mt-1">{d.note}</p>}
    </div>
  );
}

function EquityCurve({ history }: { history: any[] }) {
  const hasData = history && history.length >= 2;

  return (
    <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
      <h2 className="text-base font-semibold mb-4">Capital Growth</h2>
      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No equity history yet. Close your first trade to begin tracking.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDate(v).replace(/\s\d{4}$/, "")}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={abbreviateINR}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="capital"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Section 4: Performance Row ── */

function TradeStatsCard({ performance }: { performance: any }) {
  const stats = [
    { label: "Total Trades", value: performance.total_trades ?? 0 },
    { label: "Winning", value: performance.winning_trades ?? 0 },
    { label: "Losing", value: performance.losing_trades ?? 0 },
    { label: "Max Drawdown", value: formatPct(performance.max_drawdown_pct ?? 0, false) },
  ];
  return (
    <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
      <h3 className="text-sm font-semibold mb-3">Trade Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-semibold tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeQualityCard({ performance }: { performance: any }) {
  const avgWin = performance.avg_win_inr ?? 0;
  const avgLoss = performance.avg_loss_inr ?? 0;
  const ratio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  return (
    <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
      <h3 className="text-sm font-semibold mb-3">Trade Quality</h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Avg Win</p>
          <p className="text-lg font-semibold tabular-nums text-profit mt-0.5">
            {formatINR(avgWin)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Loss</p>
          <p className="text-lg font-semibold tabular-nums text-loss mt-0.5">
            {formatINR(avgLoss)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Win:Loss Ratio</p>
          <p className="text-lg font-semibold tabular-nums mt-0.5">{ratio.toFixed(1)}×</p>
        </div>
      </div>
    </div>
  );
}

function ExitBreakdownCard({ performance }: { performance: any }) {
  const breakdown = performance.exit_breakdown ?? {};
  const items = [
    { label: "Target", count: breakdown.target ?? 0, color: "bg-profit/15 text-profit" },
    { label: "Stoploss", count: breakdown.stoploss ?? 0, color: "bg-loss/15 text-loss" },
    { label: "Timeout", count: breakdown.timeout ?? 0, color: "bg-warning/15 text-warning" },
  ];

  return (
    <div className="rounded-lg bg-card border border-border p-5 animate-fade-in">
      <h3 className="text-sm font-semibold mb-3">Exit Reasons</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span
              className={cn(
                "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums",
                item.color
              )}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard Page ── */

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your trading overview at a glance.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <SkeletonCard lines={1} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </div>
          <SkeletonCard lines={6} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <ErrorCard
          message={error?.message || "Failed to load dashboard data"}
          retryFn={refetch}
        />
      )}

      {data && (
        <div className="space-y-6">
          {/* Section 1: Regime Banner */}
          <RegimeBanner regime={data.regime} />

          {/* Section 2: Metric Cards */}
          <MetricCards capital={data.capital} performance={data.performance} />

          {/* Section 3: Equity Curve */}
          <EquityCurve history={data.history} />

          {/* Section 4: Performance Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TradeStatsCard performance={data.performance} />
            <TradeQualityCard performance={data.performance} />
            <ExitBreakdownCard performance={data.performance} />
          </div>
        </div>
      )}
    </div>
  );
}
