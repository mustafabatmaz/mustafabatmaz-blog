import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/content";
import { ogSize, pageCard } from "@/lib/og";
import { ogContentType, ogLocale } from "@/lib/ogPages";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Mustafa Batmaz";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await ogLocale(params);
  const t = await getTranslations({ locale, namespace: "site" });
  // The card must draw even when the API is down
  const profile = await getProfile(locale).catch(() => null);
  return pageCard({
    name: t("name"),
    label: `/${locale}`,
    title: profile?.fullName ?? t("name"),
    subtitle: profile?.headline ?? t("defaultDescription"),
  });
}
