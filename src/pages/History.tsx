import { useHistory } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function History() {
  const { data, isLoading, isError, error, refetch } = useHistory();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
      <p className="text-muted-foreground text-sm mt-1">Completed swing trades.</p>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6">
          <ErrorCard message={error?.message || "Failed to load history"} retryFn={refetch} />
        </div>
      )}

      {data && data.length === 0 && (
        <div className="mt-6 text-center py-12 text-muted-foreground">
          <p className="text-sm">No trade history yet. Close a position to see it here.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Entry</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Exit</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">P&L</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Return</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Closed</th>
                </tr>
              </thead>
              <tbody>
                {data.map((trade: any, i: number) => {
                  const pnl = trade.pnl ?? (trade.exit_price - trade.entry_price) * trade.qty;
                  const ret = trade.return_pct ?? ((trade.exit_price - trade.entry_price) / trade.entry_price) * 100;
                  return (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(trade.entry_price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(trade.exit_price)}</td>
                      <td className={cn("px-4 py-3 text-right tabular-nums", pnl >= 0 ? "text-profit" : "text-loss")}>
                        {formatINR(pnl)}
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums", ret >= 0 ? "text-profit" : "text-loss")}>
                        {formatPct(ret)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(trade.exit_date ?? trade.closed_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
