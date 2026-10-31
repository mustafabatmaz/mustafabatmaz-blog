import Markdown, { type Options } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { articleComponents } from "./components";
import { rehypeCodeFigure, rehypeCodeMeta, rehypeHeadingIds, sanitizeSchema } from "./plugins";

const remarkPlugins = [remarkGfm];
// No Shiki here: the admin preview runs in the browser and stays light (5c decision 2)
const rehypePlugins: Options["rehypePlugins"] = [
  rehypeCodeMeta,
  [rehypeSanitize, sanitizeSchema],
  rehypeCodeFigure,
  rehypeHeadingIds,
];

// The article wrapper: the first paragraph is the lead, larger like the intro of the approved post page
export const articleClassName =
  "flex flex-col gap-7 text-[18px] leading-[1.75] text-prose [&>p:first-child]:text-[21px] [&>p:first-child]:leading-[1.6] [&>p:first-child]:font-medium [&>p:first-child]:text-foreground";

export function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <div className={articleClassName}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={articleComponents}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
