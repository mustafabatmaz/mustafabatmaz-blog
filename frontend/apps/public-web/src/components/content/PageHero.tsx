import type { ReactNode } from "react";

// The big page title with the indigo dot (C-Experience), optionally a mono label above and a line below
export function PageHero({
  title,
  label,
  children,
  lang,
}: {
  title: string;
  label?: string | undefined;
  children?: ReactNode;
  lang?: string | undefined;
}) {
  return (
    <section className="flex max-w-190 flex-col gap-5">
      {label && <span className="font-mono text-[13px] text-link">{label}</span>}
      <h1
        lang={lang}
        className="text-5xl leading-none font-bold tracking-tighter break-words sm:text-7xl"
      >
        {title}
        <span className="text-link">.</span>
      </h1>
      {children && <p className="text-[19px] leading-relaxed text-muted-foreground">{children}</p>}
    </section>
  );
}
