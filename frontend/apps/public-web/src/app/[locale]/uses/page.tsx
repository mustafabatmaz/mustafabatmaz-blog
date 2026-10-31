import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pageAlternates, pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/content/PageHero";
import { getUses } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();
  return pageMetadata({
    locale,
    title: t("uses.title"),
    description: t("uses.intro"),
    alternates: pageAlternates("/uses", locale),
    siteName: t("site.name"),
  });
}

// Grouped by category like the experience timeline (public canvas, "Kullandıklarım" draft)
export default async function UsesPage() {
  const locale = await getLocale();
  const [categories, t] = await Promise.all([getUses(locale), getTranslations("uses")]);

  return (
    <div className="flex flex-col gap-18">
      <PageHero title={t("title")}>{t("intro")}</PageHero>
      {categories.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col">
          {categories.map((group, index) => (
            <li key={group.category} className="flex flex-wrap gap-x-12 gap-y-6 border-t py-10">
              <div className="flex flex-[1_1_220px] flex-col gap-2">
                <span className="font-mono text-[13px] text-link">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[26px] leading-tight font-bold tracking-tight">
                  {t(`categories.${group.category}`)}
                </h2>
              </div>
              <ul className="flex min-w-0 flex-[999_1_520px] flex-col">
                {/* Names aren't unique (the admin can list the same tool twice), so the position is the key */}
                {group.items.map((item, position) => (
                  <li
                    key={position}
                    lang={item.lang}
                    className="flex flex-col gap-1 border-t py-4.5 first:border-t-0 first:pt-0"
                  >
                    {item.url ? (
                      <a
                        href={item.url}
                        className="text-lg font-semibold text-foreground no-underline"
                      >
                        {item.name}{" "}
                        <span aria-hidden="true" className="text-link">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <span className="text-lg font-semibold">{item.name}</span>
                    )}
                    {item.description && (
                      <span className="text-base leading-relaxed text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
