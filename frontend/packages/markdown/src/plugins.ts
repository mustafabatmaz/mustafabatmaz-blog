import { slugify } from "@blog/slug";
import type { Element, ElementContent, Root, RootContent } from "hast";
import { defaultSchema } from "rehype-sanitize";

// The markdown → HTML steps around rehype-sanitize (5c decision 3):
//   codeMeta → sanitize → codeFigure → headingIds → (Shiki on the public site)
// Sanitize cleans everything the author wrote first; the steps after it only add elements and text of their own.

function visitElements(
  node: Root | Element,
  visit: (element: Element, parent: Root | Element) => void,
) {
  for (const child of node.children as (RootContent | ElementContent)[]) {
    if (child.type === "element") {
      visit(child, node);
      visitElements(child, visit);
    }
  }
}

const titlePattern = /title="([^"]*)"/;

// ```java title="ApplicationStatus.java"``` keeps its title in the code element's data, which sanitize drops;
// carry it as a data-title attribute the schema allows on <code>
export function rehypeCodeMeta() {
  return (tree: Root) => {
    visitElements(tree, (element) => {
      const meta = (element.data as { meta?: string } | undefined)?.meta;
      const title = element.tagName === "code" && meta ? titlePattern.exec(meta)?.[1] : undefined;
      if (title) {
        element.properties.dataTitle = title;
      }
    });
  };
}

// GitHub's allowlist plus data-title on <code>; ids keep their user-content- prefix, ours are added afterwards
export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "dataTitle"],
  },
};

function languageOf(code: Element) {
  const classes = code.properties.className;
  const language = Array.isArray(classes)
    ? classes.map(String).find((name) => name.startsWith("language-"))
    : undefined;
  return language?.slice("language-".length);
}

const text = (value: string): ElementContent => ({ type: "text", value });
const span = (value: string): ElementContent => ({
  type: "element",
  tagName: "span",
  properties: {},
  children: [text(value)],
});

// Wraps a code block in <figure> with a <figcaption> "file name · language" (C-Post). Runs before Shiki,
// which replaces the <pre> it finds inside. Only text goes into the caption.
export function rehypeCodeFigure() {
  return (tree: Root) => {
    visitElements(tree, (pre, parent) => {
      const code = pre.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (
        pre.tagName !== "pre" ||
        !code ||
        (parent.type === "element" && parent.tagName === "figure")
      ) {
        return;
      }
      const title =
        typeof code.properties.dataTitle === "string" ? code.properties.dataTitle : undefined;
      const language = languageOf(code);
      delete code.properties.dataTitle;
      if (!title && !language) {
        return;
      }
      const caption: Element = {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: [span(title ?? ""), span(language ?? "")],
      };
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: {},
        children: [caption, pre],
      };
      parent.children.splice(parent.children.indexOf(pre), 1, figure);
    });
  };
}

function textOf(node: Element): string {
  return node.children
    .map((child) =>
      child.type === "text" ? child.value : child.type === "element" ? textOf(child) : "",
    )
    .join("");
}

// The id a heading gets: its text as a slug, "-2", "-3" … for repeats (5c decision 4). extractHeadings uses
// the same function, so the table of contents always points at ids that exist.
export function headingId(text: string, seen: Map<string, number>) {
  const base = slugify(text) || "bolum";
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${String(count)}`;
}

// Readable ids on section headings, added after sanitize (so no user-content- prefix): #sorunun-kaynagi
export function rehypeHeadingIds() {
  return (tree: Root) => {
    const seen = new Map<string, number>();
    visitElements(tree, (element) => {
      if (element.tagName === "h1" || element.tagName === "h2" || element.tagName === "h3") {
        element.properties.id = headingId(textOf(element), seen);
      }
    });
  };
}
