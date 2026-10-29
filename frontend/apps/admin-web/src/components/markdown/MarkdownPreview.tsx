import { MarkdownContent, type MarkdownComponents } from "@blog/markdown";

// Close to the approved post page (C-Post) until Phase 5 moves the real article styles into @blog/markdown.
// Only children (and href) are passed on, so no unknown attributes reach the DOM.
const components: MarkdownComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold tracking-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold tracking-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>,
  p: ({ children }) => <p className="leading-7">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} className="text-link underline underline-offset-4">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-input pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-xl bg-code p-4 font-mono text-[13px] text-code-foreground [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-3 py-1.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border px-3 py-1.5">{children}</td>,
  hr: () => <hr className="border-t" />,
};

export function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="flex flex-col gap-3 text-[15px]">
      <MarkdownContent components={components}>{markdown}</MarkdownContent>
    </div>
  );
}
