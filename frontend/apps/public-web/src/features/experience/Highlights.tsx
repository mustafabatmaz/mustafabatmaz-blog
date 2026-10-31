import { MarkdownContent, type MarkdownComponents } from "@blog/markdown";

// A project's highlights are a short markdown list; inside the project card they use the card's smaller text
// (C-Experience) rather than the article look
const components: MarkdownComponents = {
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-2 pl-5">{children}</ol>,
  p: ({ children }) => <p>{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="text-link underline underline-offset-4">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-sm text-secondary-foreground">
      {children}
    </code>
  ),
};

export function Highlights({ markdown }: { markdown: string }) {
  return (
    <div className="flex flex-col gap-2 text-base leading-relaxed text-prose">
      <MarkdownContent components={components}>{markdown}</MarkdownContent>
    </div>
  );
}
