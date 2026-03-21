import { useScreener } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function Screener() {
  const { data, isLoading, isError, error, refetch } = useScreener();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Screener</h1>
      <p className="text-muted-foreground text-sm mt-1">Stocks matching your swing criteria.</p>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6">
          <ErrorCard message={error?.message || "Failed to load screener"} retryFn={refetch} />
        </div>
      )}

      {data && data.length === 0 && (
        <div className="mt-6 text-center py-12 text-muted-foreground">
          <p className="text-sm">No stocks match your criteria right now.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">CMP</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Change</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Signal</th>
                </tr>
              </thead>
              <tbody>
                {data.map((stock: any, i: number) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{stock.symbol}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINR(stock.cmp)}</td>
                    <td className={cn("px-4 py-3 text-right tabular-nums", stock.change_pct >= 0 ? "text-profit" : "text-loss")}>
                      {formatPct(stock.change_pct)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded text-xs font-medium",
                        stock.signal === "BUY" && "bg-profit/10 text-profit",
                        stock.signal === "SELL" && "bg-loss/10 text-loss",
                        stock.signal === "WATCH" && "bg-warning/10 text-warning"
                      )}>
                        {stock.signal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
