import { cn } from "cn";

const sizes = {
  md: { circle: "size-10", m: "text-[17px]", b: "text-[11px]" },
  lg: { circle: "size-14", m: "text-[23px]", b: "text-[15px]" },
};

// "m/b": bold m (Space Grotesk 700) and light /b (Space Mono 400) in a circle; see PROJECT_DECISION.md §6
export function Monogram({ size = "md" }: { size?: keyof typeof sizes }) {
  const s = sizes[size];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center rounded-full bg-monogram leading-none tracking-tight",
        s.circle,
      )}
    >
      <span className={cn("font-sans font-bold text-monogram-m", s.m)}>m</span>
      <span className={cn("font-mono text-monogram-b", s.b)}>/b</span>
    </span>
  );
}
