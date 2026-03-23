import { useState, useCallback } from "react";
import { useRegime, useOpenPosition } from "@/hooks/useApi";
import { api } from "@/services/api";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { formatINR, formatPct } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { AlertTriangle, Loader2, Search, ShieldOff } from "lucide-react";
import { toast } from "sonner";

function stripNS(ticker: string) {
  return ticker.replace(/\.NS$/, "");
}

function sourceBadge(source: string) {
  if (source === "confluence")
    return <Badge className="bg-profit/15 text-profit border-0 hover:bg-profit/20">CONFLUENCE</Badge>;
  if (source === "S1_only")
    return <Badge className="bg-info/15 text-info border-0 hover:bg-info/20">S1 Only</Badge>;
  return <Badge className="bg-purple-500/15 text-purple-400 border-0 hover:bg-purple-500/20">S2 Only</Badge>;
}

function rrColor(rr: number) {
  if (rr >= 2) return "text-profit";
  if (rr >= 1.5) return "text-warning";
  return "text-loss";
}

function regimeMode(regime: any): "bullish" | "cautious" | "bear" {
  return regime.regime_mode ?? (regime.is_bullish ? "bullish" : "bear");
}

function regimeBadge(mode: "bullish" | "cautious" | "bear") {
  if (mode === "bullish")
    return <Badge className="bg-profit/15 text-profit border-0">Bullish</Badge>;
  if (mode === "cautious")
    return <Badge className="bg-warning/15 text-warning border-0">Cautious</Badge>;
  return <Badge className="bg-loss/15 text-loss border-0">Bear</Badge>;
}

export default function Screener() {
  const { data: regime, isLoading: regimeLoading, isError: regimeError, error: regimeErr, refetch: refetchRegime } = useRegime();

  const [screenerResults, setScreenerResults] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [recordedTickers, setRecordedTickers] = useState<Set<string>>(new Set());
  const [confirmTrade, setConfirmTrade] = useState<any | null>(null);

  const openPosition = useOpenPosition();

  const runScreener = useCallback(async () => {
    setIsRunning(true);
    setScreenerResults(null);
    try {
      const result = await api.runScreener();
      setScreenerResults(result);
    } catch (e: any) {
      toast.error(e.message || "Screener failed");
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleConfirmTrade = useCallback(async () => {
    if (!confirmTrade) return;
    try {
      await openPosition.mutateAsync({
        ticker: confirmTrade.ticker,
        source: confirmTrade.source,
        entry_price: confirmTrade.entry_price,
        shares: confirmTrade.shares,
        investment_inr: confirmTrade.investment_inr,
        target_price: confirmTrade.target_price,
        stoploss_price: confirmTrade.stoploss_price,
        max_hold_days: confirmTrade.max_hold_days,
        s1_score: confirmTrade.s1_score,
        s2_score: confirmTrade.s2_score,
      });
      toast.success(`Trade recorded — ${stripNS(confirmTrade.ticker)}`);
      setRecordedTickers((prev) => new Set(prev).add(confirmTrade.ticker));
      setConfirmTrade(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to record trade");
    }
  }, [confirmTrade, openPosition]);

  const mode = regime ? regimeMode(regime) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Screener</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan Nifty 500 for swing trade setups.
        </p>
      </div>

      {/* SECTION 1: REGIME STATUS */}
      {regimeLoading && <SkeletonCard lines={3} />}
      {regimeError && (
        <ErrorCard message={regimeErr?.message || "Failed to load regime"} retryFn={refetchRegime} />
      )}
      {regime && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Market Regime</CardTitle>
              {regimeBadge(mode!)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Nifty Close</span>
                <p className="font-semibold tabular-nums">{formatINR(regime.nifty_close)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">50 EMA</span>
                <p className="font-semibold tabular-nums">{formatINR(regime.ema50)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">200 EMA</span>
                <p className="font-semibold tabular-nums">{formatINR(regime.ema200)}</p>
              </div>
            </div>

            {mode === "bullish" && (
              <p className="text-sm text-profit font-medium">Screener active this week</p>
            )}

            {mode === "cautious" && (
              <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm text-warning">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Cautious regime. Running with reduced risk: max 2 trades, confluence signals only, tighter stop losses.
                </span>
              </div>
            )}

            {mode === "bear" && (
              <div className="flex items-start gap-2 rounded-md bg-loss/10 p-3 text-sm text-loss">
                <ShieldOff className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Bear market confirmed. The screener has been skipped. Consider holding cash until the market recovers above the 200 EMA.
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">{regime.message}</p>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: RUN SCREENER BUTTON */}
      {regime && !isRunning && !screenerResults && (
        <div className="flex justify-center">
          {mode === "bullish" && (
            <Button
              onClick={runScreener}
              size="lg"
              className="bg-profit hover:bg-profit/90 text-white px-8 active:scale-[0.97] transition-transform"
            >
              <Search className="h-4 w-4 mr-2" />
              Run Screener
            </Button>
          )}
          {mode === "cautious" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={runScreener}
                    size="lg"
                    className="bg-warning hover:bg-warning/90 text-white px-8 active:scale-[0.97] transition-transform"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Run Screener
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cautious regime — reduced risk parameters applied.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {mode === "bear" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    disabled
                    className="bg-muted text-muted-foreground px-8"
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Run Screener
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bear market — screener skipped automatically</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* LOADING STATE */}
      {isRunning && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning Nifty 500 stocks...
            </div>
            <p className="text-xs text-muted-foreground">
              This usually takes 10–20 minutes. Keep this tab open.
            </p>
            <div className="w-full max-w-md">
              <Progress value={undefined} className="h-2 [&>div]:animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* SKIPPED STATE */}
      {screenerResults?.skipped && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Screener skipped — bearish market regime. No suggestions generated this week.
          </span>
        </div>
      )}

      {/* RESULTS */}
      {screenerResults && !screenerResults.skipped && (
        <>
          {/* CAUTIOUS MODE BANNER */}
          {screenerResults.cautious_mode && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Cautious mode active — showing top 2 confluence signals only with tighter risk parameters.
              </span>
            </div>
          )}

          {/* META LINE */}
          <p className="text-xs text-muted-foreground">
            Screened {screenerResults.screened_stocks} stocks · S1 signals: {screenerResults.s1_count} · S2 signals: {screenerResults.s2_count} · Confluence: {screenerResults.confluence_count} · Run at: {screenerResults.run_at}
          </p>

          {/* SUGGESTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {screenerResults.suggestions.map((s: any) => {
              const ticker = s.ticker;
              const display = stripNS(ticker);
              const upside = ((s.target_price - s.entry_price) / s.entry_price) * 100;
              const downside = ((s.stoploss_price - s.entry_price) / s.entry_price) * 100;
              const isRecorded = recordedTickers.has(ticker);

              return (
                <Card key={ticker} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold tracking-tight">{display}</span>
                      {sourceBadge(s.source)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="rounded-md bg-muted/50 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entry</span>
                        <span className="tabular-nums font-medium">{formatINR(s.entry_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target</span>
                        <span className="tabular-nums">
                          {formatINR(s.target_price)}{" "}
                          <span className="text-profit">{formatPct(upside)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stop Loss</span>
                        <span className="tabular-nums">
                          {formatINR(s.stoploss_price)}{" "}
                          <span className="text-loss">{formatPct(downside)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">R:R Ratio</span>
                        <span className={cn("font-semibold tabular-nums", rrColor(s.rr_ratio))}>
                          {s.rr_ratio.toFixed(1)}:1
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shares</span>
                        <span className="tabular-nums">{s.shares}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Investment</span>
                        <span className="tabular-nums">{formatINR(s.investment_inr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Potential Profit</span>
                        <span className="tabular-nums text-profit">{formatINR(s.potential_profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Loss</span>
                        <span className="tabular-nums text-loss">{formatINR(s.max_loss)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Hold</span>
                        <span>{s.max_hold_days} trading days</span>
                      </div>
                    </div>

                    {(s.s1_score != null || s.s2_score != null) && (
                      <p className="text-xs text-muted-foreground">
                        {s.s1_score != null && `S1: ${s.s1_score}`}
                        {s.s1_score != null && s.s2_score != null && " · "}
                        {s.s2_score != null && `S2: ${s.s2_score}`}
                      </p>
                    )}

                    <Button
                      onClick={() => setConfirmTrade(s)}
                      disabled={isRecorded}
                      className={cn(
                        "w-full active:scale-[0.97] transition-transform",
                        isRecorded
                          ? "bg-muted text-muted-foreground hover:bg-muted"
                          : "bg-profit hover:bg-profit/90 text-white"
                      )}
                    >
                      {isRecorded ? "Trade Recorded" : "Place Trade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* CONFIRMATION MODAL */}
      <Dialog open={!!confirmTrade} onOpenChange={(open) => !open && setConfirmTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Trade — {confirmTrade && stripNS(confirmTrade.ticker)}</DialogTitle>
            <DialogDescription>
              Confirm you have placed this trade through your broker before recording it here.
            </DialogDescription>
          </DialogHeader>
          {confirmTrade && (
            <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry</span>
                <span className="tabular-nums">{formatINR(confirmTrade.entry_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares</span>
                <span className="tabular-nums">{confirmTrade.shares}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investment</span>
                <span className="tabular-nums">{formatINR(confirmTrade.investment_inr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target</span>
                <span className="tabular-nums">{formatINR(confirmTrade.target_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stop</span>
                <span className="tabular-nums">{formatINR(confirmTrade.stoploss_price)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTrade(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTrade}
              disabled={openPosition.isPending}
              className="bg-profit hover:bg-profit/90 text-white active:scale-[0.97] transition-transform"
            >
              {openPosition.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm & Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
