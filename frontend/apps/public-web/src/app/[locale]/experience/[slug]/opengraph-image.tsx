import { getTranslations } from "next-intl/server";
import { getCaseStudy } from "@/lib/content";
import { ogSize, pageCard } from "@/lib/og";
import { ogContentType, ogLocale } from "@/lib/ogPages";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Mustafa Batmaz";
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const locale = await ogLocale(params);
  const { slug } = await params;
  const [study, t] = await Promise.all([
    getCaseStudy(slug, locale).catch(() => null),
    getTranslations({ locale }),
  ]);
  return pageCard({
    name: t("site.name"),
    label: study ? `${study.company} · ${t("experience.caseStudy")}` : "/experience",
    title: study?.name ?? t("experience.title"),
    subtitle: study?.client,
  });
}
