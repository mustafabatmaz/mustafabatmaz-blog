"use client";

import { useLocale } from "next-intl";
import { Fragment } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Client Component: the current address is only known in the browser's router. Opens the same page in the
// other language; a post's other-language slug comes later with the posts (5c).
export function LanguageSwitcher({
  label,
  names,
}: {
  label: string;
  names: Record<Locale, string>;
}) {
  const current = useLocale();
  const pathname = usePathname();

  return (
    <span
      role="group"
      aria-label={label}
      className="flex items-center gap-2 px-2.5 font-mono text-[13px]"
    >
      {routing.locales.map((locale) => (
        <Fragment key={locale}>
          {locale === current ? (
            <span aria-current="true" className="font-bold text-foreground">
              {locale.toUpperCase()}
            </span>
          ) : (
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-label={names[locale]}
              className="rounded-full text-muted-foreground no-underline hover:text-foreground"
            >
              {locale.toUpperCase()}
            </Link>
          )}
        </Fragment>
      ))}
    </span>
  );
}
