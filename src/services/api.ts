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
