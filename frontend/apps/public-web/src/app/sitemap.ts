import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getExperience, getPage, getPost, getPosts } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { sitemapEntries, type SitemapData } from "@/lib/sitemap";

// Built per request, not at build time: it needs the backend (and SITE_URL), which a build doesn't have
// (5d decision 4)
export const dynamic = "force-dynamic";

async function allPostSlugs(locale: (typeof routing.locales)[number]) {
  const slugs: string[] = [];
  for (let page = 1; ; page += 1) {
    const result = await getPosts(locale, page);
    slugs.push(...(result?.items.map((post) => post.slug) ?? []));
    if (!result || page >= result.totalPages) {
      return slugs;
    }
  }
}

async function load(): Promise<SitemapData> {
  const [about, now, experience] = await Promise.all([
    getPage("ABOUT", routing.defaultLocale),
    getPage("NOW", routing.defaultLocale),
    getExperience(routing.defaultLocale),
  ]);
  // A post appears once per language it's written in; its details name every translation, so the post is
  // keyed by its Turkish (or only) slug to avoid listing it twice
  const posts = new Map<string, SitemapData["posts"][number]>();
  for (const locale of routing.locales) {
    for (const slug of await allPostSlugs(locale)) {
      const post = await getPost(slug, locale);
      if (post) {
        const key = post.availableTranslations.map((t) => `${t.lang}:${t.slug}`).join("|");
        posts.set(key, { updatedAt: post.updatedAt, translations: post.availableTranslations });
      }
    }
  }
  return {
    pages: {
      ...(about ? { "/about": about.updatedAt } : {}),
      ...(now ? { "/now": now.updatedAt } : {}),
    },
    posts: [...posts.values()],
    caseStudies: experience.flatMap((job) =>
      job.projects.filter((p) => p.hasCaseStudy).map((p) => p.slug),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Without the API the sitemap still lists the pages that always exist
  const data = await load().catch(() => ({ pages: {}, posts: [], caseStudies: [] }));
  return sitemapEntries(siteUrl(), data);
}
