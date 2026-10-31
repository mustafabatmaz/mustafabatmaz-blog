import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

// <link rel="canonical"> and hreflang alternates, relative to metadataBase (5d decision 6). Pages share one
// path in both languages; posts have their own slug per language and only exist where they're translated.
// x-default (the address for anyone else) is the Turkish one, the site's default language.
function withLocale(locale: Locale, path: string) {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

function rss(locale: Locale) {
  return { "application/rss+xml": `/${locale}/rss.xml` };
}

export function pageAlternates(path: string, locale: Locale) {
  const languages: Record<string, string> = {};
  for (const language of routing.locales) {
    languages[language] = withLocale(language, path);
  }
  languages["x-default"] = withLocale(routing.defaultLocale, path);
  return { canonical: withLocale(locale, path), languages, types: rss(locale) };
}

export function postAlternates(
  locale: Locale,
  slug: string,
  translations: readonly { lang: Locale; slug: string }[],
) {
  const languages: Record<string, string> = {};
  for (const translation of translations) {
    languages[translation.lang] = `/${translation.lang}/writing/${translation.slug}`;
  }
  const turkish = languages[routing.defaultLocale];
  if (turkish) {
    languages["x-default"] = turkish;
  }
  return { canonical: `/${locale}/writing/${slug}`, languages, types: rss(locale) };
}

const ogLocales: Record<Locale, string> = { tr: "tr_TR", en: "en_US" };

// One page's metadata: title (the layout adds " · Mustafa Batmaz"), description, canonical/hreflang links and
// the Open Graph fields. openGraph is replaced, not merged, when a page sets it, so the shared fields live here.
export function pageMetadata({
  locale,
  title,
  description,
  alternates,
  siteName,
  article,
}: {
  locale: Locale;
  title: string;
  description?: string | null | undefined;
  alternates: ReturnType<typeof pageAlternates>;
  siteName: string;
  article?: { publishedTime: string; tags: readonly string[] } | undefined;
}): Metadata {
  const fullTitle = title === siteName ? title : `${title} · ${siteName}`;
  return {
    title,
    ...(description ? { description } : {}),
    alternates,
    openGraph: {
      title: fullTitle,
      ...(description ? { description } : {}),
      url: alternates.canonical,
      siteName,
      locale: ogLocales[locale],
      ...(article
        ? { type: "article", publishedTime: article.publishedTime, tags: [...article.tags] }
        : { type: "website" }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      ...(description ? { description } : {}),
    },
  };
}
