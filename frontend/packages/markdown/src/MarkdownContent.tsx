import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

// The one markdown pipeline for the admin preview and (Phase 5) the public site, so both render the same.
// Safe by layers: react-markdown never renders raw HTML (no rehype-raw) and drops javascript: URLs;
// rehype-sanitize then filters the result against GitHub's allowlist.
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeSanitize];

export function MarkdownContent({
  children,
  components,
}: {
  children: string;
  components?: Components | undefined;
}) {
  return (
    <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {children}
    </Markdown>
  );
}
