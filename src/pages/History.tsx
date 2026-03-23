import { useState, useMemo } from "react";
import { useAllTrades, usePerformance } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct, formatDate, calcDaysHeld } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ClipboardList } from "lucide-react";

type SortKey =
  | "entry_date"
  | "ticker"
  | "source"
  | "entry_price"
  | "exit_date"
  | "exit_price"
  | "exit_reason"
  | "shares"
  | "pnl_inr"
  | "pnl_pct"
  | "days_held";

type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

function stripNS(ticker: string) {
  return ticker?.replace(/\.NS$/i, "") ?? "";
}

function sourceBadge(source: string) {
  const s = source?.toLowerCase();
  if (s === "confluence")
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">CONFLUENCE</Badge>;
  if (s === "s1_only" || s === "s1 only")
    return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/20">S1 Only</Badge>;
  return <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 hover:bg-purple-500/20">S2 Only</Badge>;
}

function reasonBadge(reason: string | null) {
  if (!reason) return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30">Open</Badge>;
  if (reason === "target") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Target</Badge>;
  if (reason === "stoploss") return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Stop Loss</Badge>;
  if (reason === "timeout") return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Timeout</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border">Manual</Badge>;
}

export default function History() {
  const { data: trades, isLoading: tradesLoading, isError: tradesError, error: tradesErr, refetch: refetchTrades } = useAllTrades();
  const { data: perf, isLoading: perfLoading, isError: perfError, error: perfErr, refetch: refetchPerf } = usePerformance();

  const isLoading = tradesLoading || perfLoading;
  const isError = tradesError || perfError;

  const [pnlFilter, setPnlFilter] = useState<"all" | "winners" | "losers">("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("entry_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!trades) return [];
    let result = [...trades];

    if (pnlFilter === "winners") result = result.filter((t: any) => t.pnl_inr != null && t.pnl_inr > 0);
    else if (pnlFilter === "losers") result = result.filter((t: any) => t.pnl_inr != null && t.pnl_inr < 0);

    if (reasonFilter !== "all") result = result.filter((t: any) => t.exit_reason === reasonFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t: any) => stripNS(t.ticker).toLowerCase().includes(q));
    }

    result.sort((a: any, b: any) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "ticker": av = stripNS(a.ticker); bv = stripNS(b.ticker); break;
        case "source": av = a.source; bv = b.source; break;
        case "entry_date": av = a.entry_date; bv = b.entry_date; break;
        case "entry_price": av = a.entry_price; bv = b.entry_price; break;
        case "exit_date": av = a.exit_date ?? ""; bv = b.exit_date ?? ""; break;
        case "exit_price": av = a.exit_price ?? 0; bv = b.exit_price ?? 0; break;
        case "exit_reason": av = a.exit_reason ?? ""; bv = b.exit_reason ?? ""; break;
        case "shares": av = a.shares; bv = b.shares; break;
        case "pnl_inr": av = a.pnl_inr ?? 0; bv = b.pnl_inr ?? 0; break;
        case "pnl_pct": av = a.pnl_pct ?? 0; bv = b.pnl_pct ?? 0; break;
        case "days_held":
          av = a.exit_date ? Math.floor((new Date(a.exit_date).getTime() - new Date(a.entry_date).getTime()) / 86400000) : 9999;
          bv = b.exit_date ? Math.floor((new Date(b.exit_date).getTime() - new Date(b.entry_date).getTime()) / 86400000) : 9999;
          break;
        default: av = a.entry_date; bv = b.entry_date;
      }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return result;
  }, [trades, pnlFilter, reasonFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useMemo(() => setPage(1), [pnlFilter, reasonFilter, search]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const th = (label: string, col: SortKey, align: "left" | "right" = "left") => (
    <th
      className={cn(
        "px-3 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap",
        align === "right" && "text-right"
      )}
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
      <p className="text-muted-foreground text-sm mt-1">All trades — open and closed.</p>

      {/* Loading */}
      {isLoading && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
          <SkeletonCard lines={8} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-6">
          <ErrorCard
            message={tradesErr?.message || perfErr?.message || "Failed to load data"}
            retryFn={() => { refetchTrades(); refetchPerf(); }}
          />
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && trades && perf && (
        <>
          {/* Performance Summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{perf.win_rate_pct}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total P&L</p>
                <p className={cn("text-2xl font-bold mt-1 tabular-nums", perf.total_pnl_inr >= 0 ? "text-profit" : "text-loss")}>
                  {formatINR(perf.total_pnl_inr)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Win</p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-profit">{formatINR(perf.avg_win_inr)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Loss</p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-loss">{formatINR(perf.avg_loss_inr)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Empty state */}
          {trades.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium">No completed trades yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Your trade history will appear here after you close your first position.
              </p>
            </div>
          ) : (
            <>
              {/* Filter Bar */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {(["all", "winners", "losers"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPnlFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        pnlFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {f === "all" ? "All" : f === "winners" ? "Winners" : "Losers"}
                    </button>
                  ))}
                </div>

                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="Exit Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    <SelectItem value="target">Target</SelectItem>
                    <SelectItem value="stoploss">Stop Loss</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>

                <div className="sm:ml-auto flex items-center gap-3">
                  <Input
                    placeholder="Search ticker..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-[160px] text-xs"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Showing {filtered.length} of {trades.length} trades
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-3 text-left font-medium text-muted-foreground w-10">#</th>
                        {th("Ticker", "ticker")}
                        {th("Source", "source")}
                        {th("Entry Date", "entry_date")}
                        {th("Entry Price", "entry_price", "right")}
                        {th("Exit Date", "exit_date")}
                        {th("Exit Price", "exit_price", "right")}
                        {th("Exit Reason", "exit_reason")}
                        {th("Shares", "shares", "right")}
                        {th("P&L (₹)", "pnl_inr", "right")}
                        {th("P&L (%)", "pnl_pct", "right")}
                        {th("Days", "days_held", "right")}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((trade: any, i: number) => {
                        const daysHeld = trade.exit_date
                          ? Math.floor((new Date(trade.exit_date).getTime() - new Date(trade.entry_date).getTime()) / 86400000)
                          : null;

                        return (
                          <tr key={trade.id ?? i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-3 text-muted-foreground tabular-nums">{(page - 1) * PAGE_SIZE + i + 1}</td>
                            <td className="px-3 py-3 font-medium">{stripNS(trade.ticker)}</td>
                            <td className="px-3 py-3">{sourceBadge(trade.source)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{formatDate(trade.entry_date)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{formatINR(trade.entry_price)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{trade.exit_date ? formatDate(trade.exit_date) : "—"}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{trade.exit_price != null ? formatINR(trade.exit_price) : "—"}</td>
                            <td className="px-3 py-3">{reasonBadge(trade.exit_reason)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{trade.shares}</td>
                            <td className={cn("px-3 py-3 text-right tabular-nums", trade.pnl_inr != null && (trade.pnl_inr >= 0 ? "text-profit" : "text-loss"))}>
                              {trade.pnl_inr != null ? formatINR(trade.pnl_inr) : "—"}
                            </td>
                            <td className={cn("px-3 py-3 text-right tabular-nums", trade.pnl_pct != null && (trade.pnl_pct >= 0 ? "text-profit" : "text-loss"))}>
                              {trade.pnl_pct != null ? formatPct(trade.pnl_pct) : "—"}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">{daysHeld != null ? daysHeld : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
