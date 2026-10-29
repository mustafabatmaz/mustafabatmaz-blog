import { NavLink } from "react-router";
import { cn } from "cn";
import { tr } from "@/i18n/tr";
import { PAGE_SLUGS } from "./pageSchema";

// Links, not tabs: each page has its own URL, and leaving a changed page goes through the unsaved guard
export function PageSwitch() {
  return (
    <nav aria-label={tr.pages.switchLabel} className="flex gap-6 border-b">
      {PAGE_SLUGS.map((slug) => (
        <NavLink
          key={slug}
          to={`/pages/${slug}`}
          className={({ isActive }) =>
            cn(
              "-mb-px flex h-11 items-center gap-2 border-b-2 text-base font-semibold",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )
          }
        >
          {tr.pages.names[slug]}
          <span className="font-mono text-xs font-normal text-muted-foreground">/{slug}</span>
        </NavLink>
      ))}
    </nav>
  );
}
