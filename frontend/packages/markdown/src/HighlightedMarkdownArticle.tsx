import rehypeShiki from "@shikijs/rehype";
import { MarkdownAsync } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { articleComponents } from "./components";
import { articleClassName } from "./MarkdownArticle";
import { rehypeCodeFigure, rehypeCodeMeta, rehypeHeadingIds, sanitizeSchema } from "./plugins";
import { highlightedLanguages, indigoMist } from "./theme";

// The public site's article: MarkdownArticle plus Shiki. An async Server Component, so the colouring happens
// once on the server and the browser only gets coloured HTML (5c decision 2). Shiki runs after sanitize: it
// adds only spans with the theme's colours to text that sanitize has already cleaned (5c decision 3).
export async function HighlightedMarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <div className={articleClassName}>
      {await MarkdownAsync({
        children: markdown,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeCodeMeta,
          [rehypeSanitize, sanitizeSchema],
          rehypeCodeFigure,
          rehypeHeadingIds,
          [
            rehypeShiki,
            { theme: indigoMist, langs: [...highlightedLanguages], fallbackLanguage: "text" },
          ],
        ],
        components: articleComponents,
      })}
    </div>
  );
}
