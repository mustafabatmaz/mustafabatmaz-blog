import { getLocale, getTranslations } from "next-intl/server";
import { getSocialLinks } from "@/lib/content";

// The RSS feed, then the profile's links; if the profile can't be loaded the footer shows only the feed
// (5b decision 8, 5d decision 3)
export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getTranslations();
  const links = await getSocialLinks(locale);

  return (
    <footer className="flex flex-wrap justify-between gap-3 border-t pt-6 text-sm text-muted-foreground">
      <span>
        © {new Date().getFullYear()} {t("site.name")}
      </span>
      <ul className="flex flex-wrap gap-x-2 font-mono text-xs">
        <li>
          {/* A plain link: the feed is XML, not a page the app router can open */}
          <a
            href={`/${locale}/rss.xml`}
            className="text-muted-foreground no-underline hover:text-foreground"
          >
            {t("site.rss")}
          </a>
        </li>
        {links.map((link) => (
          <li key={link.url} className="flex gap-2">
            <span aria-hidden="true">·</span>
            <a href={link.url} className="text-muted-foreground no-underline hover:text-foreground">
              {t(`platforms.${link.platform}`)}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
