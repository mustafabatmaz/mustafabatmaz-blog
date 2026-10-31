import { MarkdownArticle } from "@blog/markdown";

// The public site's article look (C-Post), so the preview shows the post the way visitors will see it
export function MarkdownPreview({ markdown }: { markdown: string }) {
  return <MarkdownArticle markdown={markdown} />;
}
