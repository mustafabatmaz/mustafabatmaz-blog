import type { ReactNode } from "react";
import { cn } from "cn";

const tones = {
  mint: "border-mint bg-mint text-mint-foreground",
  accent: "border-accent bg-accent text-accent-foreground",
  danger: "border-destructive-border bg-destructive-soft text-destructive",
  muted: "border-input text-muted-foreground",
};

// Small mono pill; the text always says what the colour means
export function StatusBadge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[11px] whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
