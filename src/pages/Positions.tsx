import { usePositions } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct, formatDate, calcDaysHeld } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function Positions() {
  const { data, isLoading, isError, error, refetch } = usePositions();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Open Positions</h1>
      <p className="text-muted-foreground text-sm mt-1">Currently held swing trades.</p>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6">
          <ErrorCard message={error?.message || "Failed to load positions"} retryFn={refetch} />
        </div>
      )}

      {data && data.length === 0 && (
        <div className="mt-6 text-center py-12 text-muted-foreground">
          <p className="text-sm">No open positions. Scout the screener for setups.</p>
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
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">CMP</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">P&L</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Days</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((pos: any, i: number) => {
                  const pnl = (pos.cmp - pos.entry_price) * pos.qty;
                  const pnlPct = ((pos.cmp - pos.entry_price) / pos.entry_price) * 100;
                  return (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{pos.symbol}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(pos.entry_price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(pos.cmp)}</td>
                      <td className={cn("px-4 py-3 text-right tabular-nums", pnl >= 0 ? "text-profit" : "text-loss")}>
                        {formatINR(pnl)} ({formatPct(pnlPct)})
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{calcDaysHeld(pos.entry_date)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(pos.entry_date)}</td>
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
