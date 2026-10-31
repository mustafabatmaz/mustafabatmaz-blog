import { cn } from "cn";

// The mint pill for technologies and skills (§6)
export function Chip({ children, size = "sm" }: { children: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "rounded-full bg-mint font-mono text-mint-foreground",
        size === "md" ? "px-4 py-2 text-[13px]" : "px-3 py-1.5 text-xs",
      )}
    >
      {children}
    </span>
  );
}
