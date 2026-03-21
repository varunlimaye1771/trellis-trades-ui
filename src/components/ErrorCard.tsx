import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  message: string;
  retryFn?: () => void;
}

export function ErrorCard({ message, retryFn }: ErrorCardProps) {
  return (
    <div className="rounded-lg border border-loss/20 bg-loss/5 p-5 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-loss shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1 break-words">{message}</p>
        {retryFn && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={retryFn}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
