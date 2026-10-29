import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  actions,
}: {
  kicker: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[13px] text-muted-foreground">{kicker}</span>
        <h1 className="text-4xl leading-tight font-bold tracking-tight">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
