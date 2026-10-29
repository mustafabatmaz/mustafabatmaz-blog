import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { Annotation, Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderText } from "@codemirror/view";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { editorTheme } from "./editorTheme";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (() => void) | undefined;
  labelId: string;
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
  placeholder?: string | undefined;
}

// Marks text that came from React (a form reset), so it isn't reported back as if the user typed it
const fromOutside = Annotation.define<boolean>();

// CodeMirror keeps its own document and DOM. React only gives it a <div> to live in: the editor is created
// once on mount and destroyed on unmount, and later value changes are pushed into it as transactions.
export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  labelId,
  describedBy,
  invalid,
  placeholder,
}: MarkdownEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialValue = useRef(value);
  const [attributes] = useState(() => new Compartment());

  // Effect events always see the latest props without making the mount effect re-run
  const emitChange = useEffectEvent((next: string) => {
    onChange(next);
  });
  const emitBlur = useEffectEvent(() => {
    onBlur?.();
  });

  useEffect(() => {
    if (!parentRef.current) {
      return;
    }
    const view = new EditorView({
      parent: parentRef.current,
      state: EditorState.create({
        doc: initialValue.current,
        extensions: [
          history(),
          // No indentWithTab: Tab keeps moving focus to the next field (keyboard accessibility)
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
          EditorView.lineWrapping,
          editorTheme,
          placeholderText(placeholder ?? ""),
          attributes.of([]),
          EditorView.updateListener.of((update) => {
            const typed = !update.transactions.some((tr) => tr.annotation(fromOutside));
            if (update.docChanged && typed) {
              emitChange(update.state.doc.toString());
            }
          }),
          EditorView.domEventHandlers({
            blur: () => {
              emitBlur();
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Created once; placeholder changes are not expected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes]);

  // A form reset (or loaded data) replaces the whole document
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: fromOutside.of(true),
      });
    }
  }, [value]);

  // The contenteditable is not a labelable element, so the label is linked through aria-labelledby
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: attributes.reconfigure(
        EditorView.contentAttributes.of({
          role: "textbox",
          "aria-multiline": "true",
          "aria-labelledby": labelId,
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          ...(invalid ? { "aria-invalid": "true" } : {}),
        }),
      ),
    });
  }, [attributes, labelId, describedBy, invalid]);

  return <div ref={parentRef} className="font-mono" />;
}
