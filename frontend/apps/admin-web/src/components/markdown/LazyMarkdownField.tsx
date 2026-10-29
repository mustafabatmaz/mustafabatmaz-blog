import { lazy, Suspense } from "react";
import { tr } from "@/i18n/tr";
import type { MarkdownFieldProps } from "./MarkdownField";

// CodeMirror and the markdown pipeline load in their own chunk, only on screens that show an editor
const MarkdownField = lazy(() =>
  import("./MarkdownField").then((module) => ({ default: module.MarkdownField })),
);

export function LazyMarkdownField(props: MarkdownFieldProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="flex min-h-80 items-center justify-center rounded-2xl border border-input bg-card text-sm text-muted-foreground"
        >
          {tr.common.loading}
        </div>
      }
    >
      <MarkdownField {...props} />
    </Suspense>
  );
}
