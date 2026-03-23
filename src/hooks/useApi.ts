import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: api.healthCheck,
    retry: 2,
    refetchInterval: 30000,
  });
}

export function useCapital() {
  return useQuery({
    queryKey: ["capital"],
    queryFn: api.getCapital,
    refetchInterval: 60000,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboardSummary,
  });
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: api.getDashboardData,
  });
}

export function useScreener() {
  return useQuery({
    queryKey: ["screener"],
    queryFn: api.getScreenerResults as () => Promise<any>,
  });
}

export function useRegime() {
  return useQuery({
    queryKey: ["regime"],
    queryFn: api.getScreenerRegime,
  });
}

export function useRunScreener() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.runScreener(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["screener"] });
    },
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: api.getPositions,
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ["history"],
    queryFn: api.getHistory,
  });
}

export function useClosePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, exit_price, exit_reason, exit_date }: { id: string | number; exit_price: number; exit_reason: string; exit_date: string }) =>
      api.closePosition(id, { exit_price, exit_reason, exit_date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["capital"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}

export function useOpenPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.openPosition(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["capital"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
