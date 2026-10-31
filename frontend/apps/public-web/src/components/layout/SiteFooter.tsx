import { getLocale, getTranslations } from "next-intl/server";
import { getSocialLinks } from "@/lib/content";

// The links come from the profile; if it can't be loaded the footer simply shows none (5b decision 8)
export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations();
  const links = await getSocialLinks(locale);

  return (
    <footer className="flex flex-wrap justify-between gap-3 border-t pt-6 text-sm text-muted-foreground">
      <span>
        © {new Date().getFullYear()} {t("site.name")}
      </span>
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-x-2 font-mono text-xs">
          {links.map((link, index) => (
            <li key={link.url} className="flex gap-2">
              {index > 0 && <span aria-hidden="true">·</span>}
              <a
                href={link.url}
                className="text-muted-foreground no-underline hover:text-foreground"
              >
                {t(`platforms.${link.platform}`)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </footer>
  );
}
