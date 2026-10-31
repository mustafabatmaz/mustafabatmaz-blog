import type { Schemas } from "@blog/api-client";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { api, dataOrNull } from "./api";

// One function per public endpoint. They run on the server only; pages are cached as a whole (revalidate),
// so these need no caching of their own beyond React's per-render cache() below.

// The home page and the footer both need the profile: cache() makes that one request per render
export const getProfile = cache((lang: Locale) =>
  dataOrNull(api.GET("/api/public/profile", { params: { query: { lang } } })),
);

export function getPage(key: Schemas["PageResponse"]["key"], lang: Locale) {
  return dataOrNull(
    api.GET("/api/public/pages/{key}", { params: { path: { key }, query: { lang } } }),
  );
}

export async function getUses(lang: Locale) {
  return (await dataOrNull(api.GET("/api/public/uses", { params: { query: { lang } } }))) ?? [];
}

export async function getExperience(lang: Locale) {
  return (
    (await dataOrNull(api.GET("/api/public/experience", { params: { query: { lang } } }))) ?? []
  );
}

// null: the project doesn't exist or has no case study in any language
export function getCaseStudy(slug: string, lang: Locale) {
  return dataOrNull(
    api.GET("/api/public/experience/projects/{slug}", {
      params: { path: { slug }, query: { lang } },
    }),
  );
}

// Posts don't fall back to the other language, so these are the newest ones written in this one
export async function getLatestPosts(lang: Locale, count = 3) {
  const page = await dataOrNull(
    api.GET("/api/public/posts", { params: { query: { lang, page: 1 } } }),
  );
  return page?.items.slice(0, count) ?? [];
}

// The footer must never take a page down: without a profile (or with the API failing) it just shows no links,
// and the next background refresh brings them back (5b decision 8)
export async function getSocialLinks(lang: Locale) {
  try {
    return (await getProfile(lang))?.socialLinks ?? [];
  } catch {
    return [];
  }
}
