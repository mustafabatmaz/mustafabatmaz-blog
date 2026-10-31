"use client";

import { cn } from "cn";
import { Link, usePathname } from "@/i18n/navigation";
import { isCurrentSection } from "@/lib/nav";

export type NavItem = {
  href: "/writing" | "/experience" | "/about" | "/now" | "/uses";
  label: string;
};

// Client Component only to read the current address for the highlight; the labels come from the server
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return items.map(({ href, label }) => {
    const current = isCurrentSection(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "rounded-full px-3.5 py-2.5 text-foreground no-underline hover:bg-secondary",
          current && "bg-secondary",
        )}
      >
        {label}
      </Link>
    );
  });
}
