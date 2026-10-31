import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { pageCard } from "./og";

export const ogContentType = "image/png";

// The locale of an opengraph-image route; anything unknown draws the default language's card
export async function ogLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

// The share card of a page whose title and line come from the message files
export async function messagePageCard(
  params: Promise<{ locale: string }>,
  label: string,
  title: "nav.about" | "nav.now" | "uses.title" | "experience.title" | "writing.title",
  subtitle:
    | "uses.intro"
    | "experience.intro"
    | "writing.intro"
    | "now.subtitle"
    | "site.defaultDescription",
) {
  const locale = await ogLocale(params);
  const t = await getTranslations({ locale });
  return pageCard({ name: t("site.name"), label, title: t(title), subtitle: t(subtitle) });
}
