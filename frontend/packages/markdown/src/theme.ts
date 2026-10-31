import type { ThemeRegistration } from "shiki";

// "Indigo Mist" code colours (PROJECT_DECISION.md §6). Code blocks are dark in both site themes; the block's
// background comes from the site's `code` token, so only the token colours here matter.
export const indigoMist: ThemeRegistration = {
  name: "indigo-mist",
  type: "dark",
  colors: {
    "editor.background": "#191B33",
    "editor.foreground": "#E7E8F3",
  },
  settings: [
    { settings: { foreground: "#E7E8F3" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#9A9DB8" } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "constant.language"],
      settings: { foreground: "#A3ACF0" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "support.type",
        "support.class",
      ],
      settings: { foreground: "#9ED8D1" },
    },
    {
      // More specific than "storage.type", so a Java annotation isn't coloured as a keyword
      scope: [
        "storage.type.annotation",
        "punctuation.definition.annotation",
        "meta.decorator",
        "entity.name.function.decorator",
      ],
      settings: { foreground: "#C9B8F5" },
    },
    { scope: ["string", "punctuation.definition.string"], settings: { foreground: "#B7BEF5" } },
    // Keys and tags (YAML, XML, HTML) read like keywords; attributes like types
    { scope: ["entity.name.tag"], settings: { foreground: "#A3ACF0" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#9ED8D1" } },
    { scope: ["markup.inserted"], settings: { foreground: "#9ED8D1" } },
    { scope: ["markup.deleted"], settings: { foreground: "#F2B8B5" } },
  ],
};

// The languages a post can colour; others (or none) render as plain text
export const highlightedLanguages = [
  "java",
  "kotlin",
  "typescript",
  "tsx",
  "javascript",
  "json",
  "yaml",
  "xml",
  "sql",
  "bash",
  "properties",
  "dockerfile",
  "html",
  "css",
  "diff",
] as const;
