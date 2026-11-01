import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getPosts } from "@/lib/content";
import { buildRss } from "@/lib/rss";
import { siteUrl } from "@/lib/site";

// /tr/rss.xml and /en/rss.xml: the latest posts of one language (5d decision 3). Built on every request: a
// route with a dynamic segment and no generateStaticParams isn't cached, so a revalidate here did nothing (6a)

export async function GET(_request: Request, { params }: RouteContext<"/[locale]/rss.xml">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new Response("Not found", { status: 404 });
  }
  const [posts, t] = await Promise.all([getPosts(locale, 1), getTranslations({ locale })]);
  const xml = buildRss({
    site: siteUrl(),
    locale,
    title: t("site.feedTitle"),
    description: t("writing.intro"),
    posts: posts?.items ?? [],
  });
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
