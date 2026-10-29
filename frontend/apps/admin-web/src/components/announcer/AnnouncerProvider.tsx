import { useCallback, useState, type ReactNode } from "react";
import { AnnouncerContext } from "./AnnouncerContext";

// One invisible live region for the whole app: screen readers read whatever text appears in it
// (moves, saves, deletes), while sighted users see the change on the page itself.
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState({ id: 0, text: "" });

  const announce = useCallback((text: string) => {
    // A new id remounts the text, so the same message twice in a row is read again
    setMessage((current) => ({ id: current.id + 1, text }));
  }, []);

  return (
    <AnnouncerContext value={announce}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        <span key={message.id}>{message.text}</span>
      </div>
    </AnnouncerContext>
  );
}
