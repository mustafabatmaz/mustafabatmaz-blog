import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

// Colors come from the CSS variables in index.css, so the editor follows the light/dark theme on its own
export const editorTheme = [
  EditorView.theme({
    "&": { backgroundColor: "var(--card)", color: "var(--foreground)", fontSize: "13px" },
    "&.cm-focused": { outline: "none" },
    // The parent sets font-mono; CodeMirror's own monospace stack would override it otherwise
    ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.7" },
    ".cm-content": { padding: "16px", caretColor: "var(--foreground)", minHeight: "20rem" },
    ".cm-placeholder": { color: "var(--muted-foreground)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--accent)",
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.heading, fontWeight: "700" },
      { tag: tags.strong, fontWeight: "700" },
      { tag: tags.emphasis, fontStyle: "italic" },
      { tag: tags.strikethrough, textDecoration: "line-through" },
      { tag: [tags.link, tags.url], color: "var(--link)" },
      { tag: tags.monospace, color: "var(--mint-foreground)" },
      { tag: tags.quote, color: "var(--muted-foreground)" },
      { tag: [tags.processingInstruction, tags.list], color: "var(--muted-foreground)" },
    ]),
  ),
];
