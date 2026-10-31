import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";

// The /now box on the home page shows the first paragraph of the Now page as plain text (5b decision 3).
// Reading the markdown as a tree skips headings and lists and drops link and emphasis syntax reliably.
export function nowSummary(markdown: string): string | null {
  const paragraph = fromMarkdown(markdown).children.find((node) => node.type === "paragraph");
  const text = paragraph ? toString(paragraph).trim() : "";
  return text === "" ? null : text;
}
