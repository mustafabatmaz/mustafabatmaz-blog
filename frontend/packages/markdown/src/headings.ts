import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";
import { headingId } from "./plugins";

export type TocHeading = { id: string; text: string };

// The table of contents: the "##" headings, with the ids rehypeHeadingIds gives them. Every heading up to "###"
// takes part in the numbering of repeated ids, in page order, but only "##" is listed (C-Post).
export function extractHeadings(markdown: string): TocHeading[] {
  const seen = new Map<string, number>();
  const headings: TocHeading[] = [];
  for (const node of fromMarkdown(markdown).children) {
    if (node.type !== "heading" || node.depth > 3) {
      continue;
    }
    const text = toString(node);
    const id = headingId(text, seen);
    if (node.depth === 2) {
      headings.push({ id, text });
    }
  }
  return headings;
}
