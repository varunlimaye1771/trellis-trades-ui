import { API_BASE, MOCK_MODE } from "@/config";
import { mockStore } from "./mockStore";

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
      ? Promise.resolve(mockStore.getDashboardSummary())
      : request<any>("/dashboard/summary"),

  getPortfolioCapital: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getFullCapital()) : request<any>("/portfolio/capital"),

  getPortfolioPerformance: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getPerformance()) : request<any>("/portfolio/performance"),

  getPortfolioHistory: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getHistory()) : request<any[]>("/portfolio/history"),

  getScreenerRegime: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getRegime()) : request<any>("/screener/regime"),

  // Parallel dashboard fetch
  getDashboardData: () =>
    MOCK_MODE
      ? Promise.resolve(mockStore.getDashboardData())
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
      ? delay(3000).then(() => mockStore.getScreenerResults())
      : request<any[]>("/screener"),

  runScreener: () =>
    MOCK_MODE
      ? delay(3000).then(() => mockStore.getScreenerResults())
      : request<any>("/screener/run", { method: "POST" }),

  // Positions
  getPositions: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getOpenTrades()) : request<any[]>("/trades/open"),

  closePosition: (id: string | number, data: { exit_price: number; exit_reason: string; exit_date: string }) =>
    MOCK_MODE
      ? Promise.resolve(mockStore.closePosition(id, data))
      : request<any>(`/trades/close/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),

  openPosition: (data: any) =>
    MOCK_MODE
      ? Promise.resolve(mockStore.openPosition(data))
      : request<any>("/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),

  // History
  getHistory: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getClosedTrades()) : request<any[]>("/history"),

  // All trades
  getAllTrades: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getAllTrades()) : request<any[]>("/trades/all"),

  // Performance
  getPerformance: () =>
    MOCK_MODE ? Promise.resolve(mockStore.getPerformance()) : request<any>("/portfolio/performance"),

  // Capital
  getCapital: () =>
    MOCK_MODE
      ? Promise.resolve(mockStore.getCapital())
      : request<{ current_capital: number }>("/capital"),
};
