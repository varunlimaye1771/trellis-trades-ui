/**
 * Stateful mock store — mutations persist in memory across page navigations.
 * Resets on full page reload (F5).
 */
import {
  MOCK_REGIME,
  MOCK_CAPITAL,
  MOCK_PERFORMANCE,
  MOCK_HISTORY,
  MOCK_POSITIONS,
  MOCK_CLOSED,
  MOCK_ALL_TRADES,
  MOCK_SCREENER_RESULT,
} from "./mockData";

// Deep-clone seed data so mutations don't touch originals
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

let nextId = 100;

// Mutable state
let openTrades: any[] = clone(MOCK_POSITIONS);
let closedTrades: any[] = clone(MOCK_CLOSED);
let capital: any = clone(MOCK_CAPITAL);
let performance: any = clone(MOCK_PERFORMANCE);
let history: any[] = clone(MOCK_HISTORY);

export const mockStore = {
  // ── Reads ──
  getRegime: () => clone(MOCK_REGIME),

  getCapital: () => ({ current_capital: capital.current_capital }),

  getFullCapital: () => clone(capital),

  getPerformance: () => clone(performance),

  getHistory: () => clone(history),

  getOpenTrades: () => clone(openTrades),

  getClosedTrades: () => clone(closedTrades),

  getAllTrades: () => clone([...openTrades, ...closedTrades]),

  getDashboardData: () => ({
    capital: clone(capital),
    performance: clone(performance),
    history: clone(history),
    regime: clone(MOCK_REGIME),
  }),

  getDashboardSummary: () => ({
    capital: clone(capital),
    performance: clone(performance),
    regime: clone(MOCK_REGIME),
  }),

  getScreenerResults: () => clone(MOCK_SCREENER_RESULT),

  // ── Mutations ──
  openPosition: (data: any) => {
    const trade = {
      id: nextId++,
      ticker: data.ticker,
      source: data.source,
      status: "open",
      entry_date: new Date().toISOString().slice(0, 10),
      entry_price: data.entry_price,
      shares: data.shares,
      investment_inr: data.investment_inr,
      target_price: data.target_price,
      stoploss_price: data.stoploss_price,
      max_hold_days: data.max_hold_days,
      s1_score: data.s1_score ?? null,
      s2_score: data.s2_score ?? null,
      exit_price: null,
      exit_date: null,
      exit_reason: null,
      pnl_inr: null,
      pnl_pct: null,
    };
    openTrades.push(trade);

    // Update capital
    capital.invested_inr += trade.investment_inr;
    capital.available_capital = capital.current_capital - capital.invested_inr;

    return clone(trade);
  },

  closePosition: (id: string | number, data: { exit_price: number; exit_reason: string; exit_date: string }) => {
    const numId = Number(id);
    const idx = openTrades.findIndex((t) => t.id === numId);
    if (idx === -1) throw new Error(`Trade ${id} not found`);

    const trade = openTrades[idx];
    const pnl = (data.exit_price - trade.entry_price) * trade.shares;
    const pnlPct = ((data.exit_price - trade.entry_price) / trade.entry_price) * 100;

    // Move to closed
    const closedTrade = {
      ...trade,
      status: "closed",
      exit_price: data.exit_price,
      exit_date: data.exit_date,
      exit_reason: data.exit_reason,
      pnl_inr: Math.round(pnl * 100) / 100,
      pnl_pct: Math.round(pnlPct * 100) / 100,
    };
    openTrades.splice(idx, 1);
    closedTrades.push(closedTrade);

    // Update capital
    capital.current_capital += pnl;
    capital.current_capital = Math.round(capital.current_capital * 100) / 100;
    capital.invested_inr -= trade.investment_inr;
    capital.available_capital = capital.current_capital - capital.invested_inr;
    capital.total_return_pct = Math.round(((capital.current_capital - capital.initial_capital) / capital.initial_capital) * 100 * 100) / 100;

    // Update performance
    performance.total_trades += 1;
    if (pnl >= 0) {
      performance.winning_trades += 1;
    } else {
      performance.losing_trades += 1;
    }
    performance.win_rate_pct = Math.round((performance.winning_trades / performance.total_trades) * 100 * 10) / 10;
    performance.total_pnl_inr = Math.round((performance.total_pnl_inr + pnl) * 100) / 100;
    performance.total_return_pct = capital.total_return_pct;

    // Update exit breakdown
    if (data.exit_reason === "target") performance.exit_breakdown.target += 1;
    else if (data.exit_reason === "stoploss") performance.exit_breakdown.stoploss += 1;
    else if (data.exit_reason === "timeout") performance.exit_breakdown.timeout += 1;

    // Add history point
    history.push({
      date: data.exit_date,
      capital: capital.current_capital,
      note: `Closed ${trade.ticker.replace(/\.NS$/, "")} — ${data.exit_reason}`,
    });

    return clone(closedTrade);
  },
};
