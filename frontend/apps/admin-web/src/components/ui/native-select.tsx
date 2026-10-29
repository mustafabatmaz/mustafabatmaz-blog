import * as React from "react";
import { cn } from "cn";

// A styled native <select>: the browser's own picker is accessible and keyboard-friendly on every platform
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-[15px] text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
