"use client";

import { toggleTheme } from "./theme";

// Client Component because it handles a click. It keeps no state: which icon shows is plain CSS on the
// .dark class, so the server's HTML and the browser agree and nothing flickers when React takes over.
export function ThemeToggle({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleTheme}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border bg-card text-foreground"
    >
      <svg
        aria-hidden="true"
        className="dark:hidden"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg
        aria-hidden="true"
        className="hidden dark:block"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
