import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";

// The sitemap's entries (5d decision 4): every page in both languages, each post in the languages it's
// written in, each project with a case study. Tag and paging pages stay out (thin content).
const pages = ["/", "/about", "/now", "/uses", "/experience", "/writing"] as const;

export type SitemapData = {
  // When About and Now were last edited, keyed by path
  pages: Partial<Record<(typeof pages)[number], string>>;
  posts: readonly { updatedAt: string; translations: readonly { lang: Locale; slug: string }[] }[];
  caseStudies: readonly string[];
};

export function sitemapEntries(site: URL, data: SitemapData): MetadataRoute.Sitemap {
  const absolute = (locale: Locale, path: string) =>
    new URL(path === "/" ? `/${locale}` : `/${locale}${path}`, site).href;
  const everywhere = (path: string, lastModified?: string) =>
    routing.locales.map((locale) => ({
      url: absolute(locale, path),
      ...(lastModified ? { lastModified } : {}),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((other) => [other, absolute(other, path)]),
        ),
      },
    }));

  return [
    ...pages.flatMap((path) => everywhere(path, data.pages[path])),
    ...data.posts.flatMap((post) => {
      const languages = Object.fromEntries(
        post.translations.map((t) => [t.lang, absolute(t.lang, `/writing/${t.slug}`)]),
      );
      return post.translations.map((t) => ({
        url: absolute(t.lang, `/writing/${t.slug}`),
        lastModified: post.updatedAt,
        alternates: { languages },
      }));
    }),
    ...data.caseStudies.flatMap((slug) => everywhere(`/experience/${slug}`)),
  ];
}
