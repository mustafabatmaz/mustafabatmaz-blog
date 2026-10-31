import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { nowSummary } from "@/features/now/nowSummary";
import { getPage } from "./content";
import { pageAlternates, pageMetadata } from "./seo";

// About and Now: the title the admin gave the page, and its first paragraph as the description
export async function markdownPageMetadata(
  key: "ABOUT" | "NOW",
  path: "/about" | "/now",
): Promise<Metadata> {
  const locale = await getLocale();
  const [page, t] = await Promise.all([getPage(key, locale), getTranslations("site")]);
  if (!page) {
    return {};
  }
  return pageMetadata({
    locale,
    title: page.title,
    description: nowSummary(page.bodyMd),
    alternates: pageAlternates(path, locale),
    siteName: t("name"),
  });
}

// The writing list and its tag and page variants all point at their own address
export async function writingListMetadata(path: string): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();
  return pageMetadata({
    locale,
    title: t("writing.title"),
    description: t("writing.intro"),
    alternates: pageAlternates(path, locale),
    siteName: t("site.name"),
  });
}
