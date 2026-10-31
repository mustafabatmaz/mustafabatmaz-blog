// "m/b": bold m (Space Grotesk 700) and light /b (Space Mono 400) in a circle; see PROJECT_DECISION.md §6
export function Monogram() {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 items-center justify-center rounded-full bg-monogram leading-none tracking-tight"
    >
      <span className="font-sans text-[18px] font-bold text-monogram-m">m</span>
      <span className="font-mono text-[12px] text-monogram-b">/b</span>
    </span>
  );
}
