import type { ReactNode } from "react";

// Shared by the 404 and error pages (public canvas, "Faz 5" row): mono label, big title with an indigo dot,
// a line of text and pill actions
export function PageNotice({
  label,
  title,
  text,
  children,
}: {
  label: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="flex max-w-190 flex-col gap-6 pt-12 pb-18">
      <span className="font-mono text-[13px] text-link">{label}</span>
      <h1 className="text-5xl leading-none font-bold tracking-tighter break-words sm:text-7xl">
        {title}
        <span className="text-link">.</span>
      </h1>
      <p className="max-w-140 text-[19px] leading-relaxed text-muted-foreground">{text}</p>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}
