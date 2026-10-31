import type { Components } from "react-markdown";

// The article look of the approved post page (C-Post), shared by MarkdownArticle (admin preview) and
// HighlightedMarkdownArticle (public site). Only children (and href, src, alt) are passed on, so no unknown
// attributes reach the DOM. The apps' CSS registers this folder with @source, since Tailwind doesn't scan
// node_modules.
const heading2 =
  "mt-6 scroll-mt-8 text-[30px] leading-tight font-bold tracking-[-0.03em] text-foreground";

export const articleComponents: Components = {
  // The page has its own h1 (the title), so a "#" in the body becomes a section heading
  h1: ({ children, id }) => (
    <h2 id={id} className={heading2}>
      {children}
    </h2>
  ),
  h2: ({ children, id }) => (
    <h2 id={id} className={heading2}>
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="mt-4 scroll-mt-8 text-[22px] leading-snug font-semibold text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => <p>{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="text-link underline underline-offset-4">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-2.5 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-2.5 pl-6">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-[3px] border-link pl-6 text-[22px] leading-normal font-medium tracking-tight text-foreground [&_p]:m-0">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-secondary px-[7px] py-0.5 font-mono text-[15px] text-secondary-foreground">
      {children}
    </code>
  ),
  // A code block, on its own or inside a figure; Shiki's colours sit on the spans inside
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-[18px] bg-code p-5 font-mono text-[14px] leading-[1.7] text-code-foreground [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
      {children}
    </pre>
  ),
  // "file name · language" above a code block (rehypeCodeFigure)
  figure: ({ children }) => (
    <figure className="flex flex-col overflow-hidden rounded-[18px] bg-code [&_pre]:rounded-none">
      {children}
    </figure>
  ),
  figcaption: ({ children }) => (
    <figcaption className="flex justify-between gap-4 border-b border-code-line px-5 py-3 font-mono text-xs text-code-muted">
      {children}
    </figcaption>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} loading="lazy" className="max-w-full rounded-2xl" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-base">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border px-3 py-2">{children}</td>,
  hr: () => <hr className="border-t" />,
};
