import { useState, useEffect } from "react";
import { MOCK_MODE } from "@/config";
import { mockStore } from "@/services/mockStore";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const modes = [
  { value: "bullish" as const, label: "Bull", color: "bg-profit text-white" },
  { value: "cautious" as const, label: "Caut", color: "bg-warning text-white" },
  { value: "bear" as const, label: "Bear", color: "bg-loss text-white" },
];

export function DevRegimeToggle() {
  const [current, setCurrent] = useState(mockStore.getRegimeMode());
  const queryClient = useQueryClient();

  useEffect(() => {
    return mockStore.onRegimeChange(() => setCurrent(mockStore.getRegimeMode()));
  }, []);

  if (!MOCK_MODE) return null;

  const handleSwitch = (mode: "bullish" | "cautious" | "bear") => {
    mockStore.setRegimeMode(mode);
    setCurrent(mode);
    // Invalidate all queries so pages refetch with new regime
    queryClient.invalidateQueries();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-lg bg-card border border-border shadow-lg p-1 text-xs">
      <span className="px-2 text-muted-foreground font-medium">DEV</span>
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => handleSwitch(m.value)}
          className={cn(
            "px-2.5 py-1 rounded-md font-semibold transition-colors",
            current === m.value ? m.color : "text-muted-foreground hover:bg-muted"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
