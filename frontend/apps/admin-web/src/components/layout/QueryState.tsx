import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";

// Loading and load-error states shared by the data screens
export function Loading() {
  return (
    <p role="status" className="text-muted-foreground">
      {tr.common.loading}
    </p>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p>{tr.common.loadFailed}</p>
      <Button variant="outline" onClick={onRetry}>
        {tr.common.retry}
      </Button>
    </div>
  );
}
