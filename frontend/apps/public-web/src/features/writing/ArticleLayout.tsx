import type { TocHeading } from "@blog/markdown";
import type { ReactNode } from "react";
import { TableOfContents } from "./TableOfContents";

// The post page layout (C-Post), shared with the case study: the article on the left, the table of contents
// on the right on wide screens, folded into <details> above the body on narrow ones. Without at least two
// sections there is no table of contents.
export function ArticleLayout({
  headings,
  label,
  header,
  children,
}: {
  headings: TocHeading[];
  label: string;
  header: ReactNode;
  children: ReactNode;
}) {
  const toc = headings.length >= 2 ? headings : [];
  return (
    <div className="flex items-start gap-16">
      <article className="flex max-w-175 min-w-0 flex-[999_1_560px] flex-col gap-7">
        {header}
        {toc.length > 0 && (
          <details className="rounded-2xl border px-5 py-4 lg:hidden">
            <summary className="cursor-pointer font-mono text-xs text-muted-foreground">
              {label}
            </summary>
            <nav aria-label={label} className="pt-4">
              <TableOfContents headings={toc} />
            </nav>
          </details>
        )}
        {children}
      </article>
      {toc.length > 0 && (
        <aside className="sticky top-8 hidden flex-[1_1_220px] flex-col gap-3 lg:flex">
          <span className="font-mono text-xs text-muted-foreground">{label}</span>
          <nav aria-label={label}>
            <TableOfContents headings={toc} />
          </nav>
        </aside>
      )}
    </div>
  );
}
