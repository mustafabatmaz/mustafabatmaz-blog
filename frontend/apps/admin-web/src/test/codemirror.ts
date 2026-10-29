import { EditorView } from "@codemirror/view";
import { act, waitFor } from "@testing-library/react";

// Typing into CodeMirror's contenteditable is unreliable in jsdom, so tests drive the real EditorView
// the way a keystroke would: through a transaction

export function editorIn(container: Element) {
  const content = container.querySelector<HTMLElement>(".cm-content");
  const view = content ? EditorView.findFromDOM(content) : null;
  if (!view) {
    throw new Error("CodeMirror view not found");
  }
  return view;
}

// The editor is lazy-loaded, so screens wait for it to appear
export function findEditorIn(container: Element) {
  return waitFor(() => editorIn(container));
}

export function typeInEditor(view: EditorView, text: string) {
  act(() => {
    view.dispatch({ changes: { from: view.state.doc.length, insert: text } });
  });
}
