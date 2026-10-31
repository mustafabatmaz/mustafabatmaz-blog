import type { Components } from "react-markdown";
import { MarkdownContent } from "./MarkdownContent";

// The article look of the approved post page (C-Post), shared by the public site and the admin preview so the
// preview shows what the site will. Only children (and href, src, alt) are passed on, so no unknown attributes
// reach the DOM. The apps' CSS registers this folder with @source, since Tailwind doesn't scan node_modules.
const heading2 = "mt-6 text-[30px] leading-tight font-bold tracking-[-0.03em] text-foreground";

const components: Components = {
  // The page has its own h1 (the title), so a "#" in the body becomes a section heading
  h1: ({ children }) => <h2 className={heading2}>{children}</h2>,
  h2: ({ children }) => <h2 className={heading2}>{children}</h2>,
  h3: ({ children }) => (
    <h3 className="mt-4 text-[22px] leading-snug font-semibold text-foreground">{children}</h3>
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
  // Plain dark blocks for now; Shiki adds the colours and the file name header in 5c
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-[18px] bg-code p-5 font-mono text-[14px] leading-[1.7] text-code-foreground [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} className="max-w-full rounded-2xl" />,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-base">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border px-3 py-2">{children}</td>,
  hr: () => <hr className="border-t" />,
};

export function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    // The first paragraph is the lead: larger, like the intro of the approved post page
    <div className="flex flex-col gap-7 text-[18px] leading-[1.75] text-prose [&>p:first-child]:text-[21px] [&>p:first-child]:leading-[1.6] [&>p:first-child]:font-medium [&>p:first-child]:text-foreground">
      <MarkdownContent components={components}>{markdown}</MarkdownContent>
    </div>
  );
}
