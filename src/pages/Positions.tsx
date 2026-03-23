import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePositions, useCapital, useClosePosition } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct, formatDate, calcDaysHeld } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Briefcase, ArrowUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

function stripNS(ticker: string) {
  return ticker.replace(/\.NS$/, "");
}

function sourceBadge(source: string) {
  if (source === "confluence")
    return <Badge className="bg-[hsl(var(--profit))]/15 text-[hsl(var(--profit))] border-0 text-xs">CONFLUENCE</Badge>;
  if (source === "S1_only")
    return <Badge className="bg-[hsl(var(--info))]/15 text-[hsl(var(--info))] border-0 text-xs">S1 Only</Badge>;
  return <Badge className="bg-purple-500/15 text-purple-400 border-0 text-xs">S2 Only</Badge>;
}

type SortKey = "ticker" | "source" | "entry_date" | "entry_price" | "target_price" | "stoploss_price" | "days_held";

export default function Positions() {
  const navigate = useNavigate();
  const { data: positions, isLoading, isError, error, refetch } = usePositions();
  const { data: capitalData } = useCapital();
  const closeTrade = useClosePosition();

  const [sortKey, setSortKey] = useState<SortKey>("entry_date");
  const [sortAsc, setSortAsc] = useState(false);

  // Close modal state
  const [closingTrade, setClosingTrade] = useState<any | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [exitReason, setExitReason] = useState("target");
  const [exitDate, setExitDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = useMemo(() => {
    if (!positions) return [];
    return [...positions].sort((a: any, b: any) => {
      let av: any, bv: any;
      if (sortKey === "days_held") {
        av = calcDaysHeld(a.entry_date);
        bv = calcDaysHeld(b.entry_date);
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === "string") {
        const cmp = av.localeCompare(bv);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? av - bv : bv - av;
    });
  }, [positions, sortKey, sortAsc]);

  const totalInvested = useMemo(() => {
    if (!positions) return 0;
    return positions.reduce((sum: number, p: any) => sum + p.investment_inr, 0);
  }, [positions]);

  const openCloseModal = (trade: any) => {
    setClosingTrade(trade);
    setExitPrice("");
    setExitReason("target");
    setExitDate(new Date().toISOString().slice(0, 10));
  };

  const livePnl = useMemo(() => {
    if (!closingTrade || !exitPrice || isNaN(Number(exitPrice))) return null;
    const ep = Number(exitPrice);
    const pnl = (ep - closingTrade.entry_price) * closingTrade.shares;
    const pct = ((ep - closingTrade.entry_price) / closingTrade.entry_price) * 100;
    return { pnl, pct };
  }, [closingTrade, exitPrice]);

  const handleConfirmClose = async () => {
    if (!closingTrade || !exitPrice) return;
    try {
      await closeTrade.mutateAsync({
        id: closingTrade.id,
        exit_price: Number(exitPrice),
        exit_reason: exitReason,
        exit_date: exitDate,
      });
      const pnl = (Number(exitPrice) - closingTrade.entry_price) * closingTrade.shares;
      toast.success(`Trade closed — ${stripNS(closingTrade.ticker)} · P&L: ${formatINR(pnl)}`);
      setClosingTrade(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to close trade");
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => handleSort(sortKeyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sortKey === sortKeyName ? "opacity-100" : "opacity-30")} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Open Positions</h1>
        <p className="text-muted-foreground text-sm mt-1">Currently held swing trades.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <SkeletonCard lines={1} />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorCard message={error?.message || "Failed to load positions"} retryFn={refetch} />
      )}

      {positions && positions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold mb-1">No open positions</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Run the screener to get trade suggestions, then record your trades here.
            </p>
            <Button
              onClick={() => navigate("/screener")}
              className="bg-[hsl(var(--profit))] hover:bg-[hsl(var(--profit))]/90 text-white active:scale-[0.97] transition-transform"
            >
              Go to Screener
            </Button>
          </CardContent>
        </Card>
      )}

      {positions && positions.length > 0 && (
        <>
          {/* Summary Bar */}
          <div className="text-sm text-muted-foreground">
            Open positions: <span className="font-medium text-foreground">{positions.length}</span> ·{" "}
            Total invested: <span className="font-medium text-foreground tabular-nums">{formatINR(totalInvested)}</span>
            {capitalData && (
              <>
                {" "}· Available capital:{" "}
                <span className="font-medium text-[hsl(var(--profit))] tabular-nums">
                  {formatINR(capitalData.available_capital ?? (capitalData.current_capital - totalInvested))}
                </span>
              </>
            )}
          </div>

          {/* Positions Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <SortHeader label="Ticker" sortKeyName="ticker" />
                    <SortHeader label="Source" sortKeyName="source" />
                    <SortHeader label="Entry Date" sortKeyName="entry_date" />
                    <SortHeader label="Entry Price" sortKeyName="entry_price" />
                    <SortHeader label="Target" sortKeyName="target_price" />
                    <SortHeader label="Stop Loss" sortKeyName="stoploss_price" />
                    <SortHeader label="Days Held" sortKeyName="days_held" />
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((pos: any) => {
                    const days = calcDaysHeld(pos.entry_date);
                    const daysApproaching = days >= 20 && days < 25;
                    const daysAtLimit = days >= 25;

                    return (
                      <tr key={pos.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold">{stripNS(pos.ticker)}</td>
                        <td className="px-4 py-3">{sourceBadge(pos.source)}</td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatDate(pos.entry_date)}</td>
                        <td className="px-4 py-3 tabular-nums">{formatINR(pos.entry_price)}</td>
                        <td className="px-4 py-3 tabular-nums text-[hsl(var(--profit))]">{formatINR(pos.target_price)}</td>
                        <td className="px-4 py-3 tabular-nums text-[hsl(var(--loss))]">{formatINR(pos.stoploss_price)}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {daysAtLimit ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1.5 text-[hsl(var(--loss))]">
                                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--loss))]" />
                                    {days}d
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Max hold period reached</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : daysApproaching ? (
                            <span className="inline-flex items-center gap-1.5 text-[hsl(var(--warning))]">
                              <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" />
                              {days}d
                            </span>
                          ) : (
                            <span>{days}d</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCloseModal(pos)}
                            className="border-[hsl(var(--loss))]/40 text-[hsl(var(--loss))] hover:bg-[hsl(var(--loss))]/10 hover:text-[hsl(var(--loss))] active:scale-[0.97] transition-transform"
                          >
                            Close Trade
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CLOSE TRADE MODAL */}
      <Dialog open={!!closingTrade} onOpenChange={(open) => !open && setClosingTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Trade — {closingTrade && stripNS(closingTrade.ticker)}</DialogTitle>
            <DialogDescription>
              Enter the exit details to record this trade closure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Exit Price */}
            <div className="space-y-2">
              <Label htmlFor="exit-price">Exit Price</Label>
              <Input
                id="exit-price"
                type="number"
                step="0.01"
                placeholder="Enter exit price"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
              />
              {livePnl && (
                <p className={cn("text-sm tabular-nums", livePnl.pnl >= 0 ? "text-[hsl(var(--profit))]" : "text-[hsl(var(--loss))]")}>
                  Estimated P&L: {formatINR(livePnl.pnl)} · {formatPct(livePnl.pct)}
                </p>
              )}
            </div>

            {/* Exit Reason */}
            <div className="space-y-2">
              <Label>Exit Reason</Label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="target">Target Hit</SelectItem>
                  <SelectItem value="stoploss">Stop Loss Hit</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                  <SelectItem value="manual">Manual Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exit Date */}
            <div className="space-y-2">
              <Label htmlFor="exit-date">Exit Date</Label>
              <Input
                id="exit-date"
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingTrade(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClose}
              disabled={!exitPrice || closeTrade.isPending}
              className="bg-[hsl(var(--loss))] hover:bg-[hsl(var(--loss))]/90 text-white active:scale-[0.97] transition-transform"
            >
              {closeTrade.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
