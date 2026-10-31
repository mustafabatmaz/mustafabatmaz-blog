"use client";

import { useSyncExternalStore } from "react";
import { decodeEmail } from "@/lib/email";

// Nothing to subscribe to: the address never changes once decoded
const subscribe = () => () => undefined;

// Client Component: the address is put together only in the browser, so the HTML carries just the encoded
// text (5b decision 4). useSyncExternalStore gives the server (and hydration) one value and the browser
// another: no href on the server, then React re-renders with the mailto: link once it has taken over.
export function EmailLink({
  encoded,
  label,
  className,
}: {
  encoded: string;
  label: string;
  className: string;
}) {
  const href = useSyncExternalStore(
    subscribe,
    () => {
      const email = decodeEmail(encoded);
      return email ? `mailto:${email}` : undefined;
    },
    () => undefined,
  );

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}
