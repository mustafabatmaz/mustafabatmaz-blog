import { useDeferredValue } from "react";
import { tr } from "@/i18n/tr";
import { MarkdownEditor, type MarkdownEditorProps } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";

export type MarkdownFieldProps = MarkdownEditorProps;

// Editor and live preview side by side; on narrow screens the preview wraps below
export function MarkdownField(props: MarkdownFieldProps) {
  // The preview may lag a keystroke behind: typing stays smooth even when rendering is slow
  const preview = useDeferredValue(props.value);

  return (
    <div className="flex flex-wrap overflow-hidden rounded-2xl border border-input bg-card">
      <div className="flex min-w-0 flex-[1_1_300px] flex-col border-r">
        <span className="border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
          {tr.markdown.source}
        </span>
        <MarkdownEditor {...props} />
      </div>
      <section aria-label={tr.markdown.preview} className="flex min-w-0 flex-[1_1_300px] flex-col">
        <span className="border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
          {tr.markdown.preview}
        </span>
        <div className="px-5 py-4">
          <MarkdownPreview markdown={preview} />
        </div>
      </section>
    </div>
  );
}
