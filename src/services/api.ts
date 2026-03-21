import { API_BASE } from "@/config";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  healthCheck: () => request<{ status: string }>("/"),

  // Dashboard
  getDashboardSummary: () => request<any>("/dashboard/summary"),
  getPortfolioCapital: () => request<any>("/portfolio/capital"),
  getPortfolioPerformance: () => request<any>("/portfolio/performance"),
  getPortfolioHistory: () => request<any[]>("/portfolio/history"),
  getScreenerRegime: () => request<any>("/screener/regime"),

  // Parallel dashboard fetch
  getDashboardData: () =>
    Promise.all([
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
  getScreenerResults: () => request<any[]>("/screener"),

  // Positions
  getPositions: () => request<any[]>("/positions"),
  closePosition: (id: string, exitPrice: number) =>
    request<any>(`/positions/${id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exit_price: exitPrice }),
    }),
  openPosition: (data: any) =>
    request<any>("/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // History
  getHistory: () => request<any[]>("/history"),

  // Capital
  getCapital: () => request<{ current_capital: number }>("/capital"),
};
