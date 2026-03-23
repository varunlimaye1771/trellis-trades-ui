import { API_BASE, MOCK_MODE } from "@/config";
import {
  MOCK_REGIME,
  MOCK_CAPITAL,
  MOCK_PERFORMANCE,
  MOCK_HISTORY,
  MOCK_POSITIONS,
  MOCK_CLOSED,
  MOCK_SCREENER_RESULT,
} from "./mockData";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  healthCheck: () =>
    MOCK_MODE
      ? Promise.resolve({ status: "ok" })
      : request<{ status: string }>("/"),

  // Dashboard
  getDashboardSummary: () =>
    MOCK_MODE
      ? Promise.resolve({ capital: MOCK_CAPITAL, performance: MOCK_PERFORMANCE, regime: MOCK_REGIME })
      : request<any>("/dashboard/summary"),

  getPortfolioCapital: () =>
    MOCK_MODE ? Promise.resolve(MOCK_CAPITAL) : request<any>("/portfolio/capital"),

  getPortfolioPerformance: () =>
    MOCK_MODE ? Promise.resolve(MOCK_PERFORMANCE) : request<any>("/portfolio/performance"),

  getPortfolioHistory: () =>
    MOCK_MODE ? Promise.resolve(MOCK_HISTORY) : request<any[]>("/portfolio/history"),

  getScreenerRegime: () =>
    MOCK_MODE ? Promise.resolve(MOCK_REGIME) : request<any>("/screener/regime"),

  // Parallel dashboard fetch
  getDashboardData: () =>
    MOCK_MODE
      ? Promise.resolve({
          capital: MOCK_CAPITAL,
          performance: MOCK_PERFORMANCE,
          history: MOCK_HISTORY,
          regime: MOCK_REGIME,
        })
      : Promise.all([
          request<any>("/portfolio/capital"),
          request<any>("/portfolio/performance"),
          request<any[]>("/portfolio/history"),
          request<any>("/screener/regime"),
        ]).then(([capital, performance, history, regime]) => ({
          capital,
          performance,
          history,
          regime,
        })),

  // Screener
  getScreenerResults: () =>
    MOCK_MODE
      ? delay(3000).then(() => MOCK_SCREENER_RESULT)
      : request<any[]>("/screener"),

  runScreener: () =>
    MOCK_MODE
      ? delay(3000).then(() => MOCK_SCREENER_RESULT)
      : request<any>("/screener/run", { method: "POST" }),

  // Positions
  getPositions: () =>
    MOCK_MODE ? Promise.resolve(MOCK_POSITIONS) : request<any[]>("/trades/open"),

  closePosition: (id: string | number, data: { exit_price: number; exit_reason: string; exit_date: string }) =>
    MOCK_MODE
      ? Promise.resolve({ id, ...data, status: "closed" })
      : request<any>(`/trades/close/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),

  openPosition: (data: any) =>
    MOCK_MODE
      ? Promise.resolve({ id: Date.now(), ...data, status: "open" })
      : request<any>("/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),

  // History
  getHistory: () =>
    MOCK_MODE ? Promise.resolve(MOCK_CLOSED) : request<any[]>("/history"),

  // Capital
  getCapital: () =>
    MOCK_MODE
      ? Promise.resolve({ current_capital: MOCK_CAPITAL.current_capital })
      : request<{ current_capital: number }>("/capital"),
};
