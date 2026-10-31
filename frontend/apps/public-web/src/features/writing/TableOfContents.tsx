"use client";

import type { TocHeading } from "@blog/markdown";
import { cn } from "cn";
import { useSyncExternalStore } from "react";
import { activeHeading } from "./activeHeading";

// Just under the top of the screen; a heading above this line counts as read
const OFFSET = 120;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

// Client Component only for the highlight: it follows the scroll position. Without JavaScript (and on the
// server) it is the same list of plain links, none highlighted (5c decision 4).
export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const active = useSyncExternalStore(
    subscribe,
    () =>
      activeHeading(
        headings.map(({ id }) => ({
          id,
          top: document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        })),
        OFFSET,
      ),
    () => null,
  );

  return (
    <ul className="flex flex-col gap-3">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            aria-current={heading.id === active ? "location" : undefined}
            className={cn(
              "block border-l-2 py-0.5 pl-3 text-[15px] no-underline",
              heading.id === active
                ? "border-link font-semibold text-link"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
}
