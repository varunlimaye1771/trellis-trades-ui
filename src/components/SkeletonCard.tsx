import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg bg-card p-5 space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded bg-muted animate-skeleton-pulse",
            i === 0 && "w-2/5",
            i === lines - 1 && "w-3/4",
            i > 0 && i < lines - 1 && "w-full"
          )}
        />
      ))}
    </div>
  );
}
