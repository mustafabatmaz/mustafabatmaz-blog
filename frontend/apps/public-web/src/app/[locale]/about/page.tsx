import { getLocale, getTranslations } from "next-intl/server";
import { MarkdownPage } from "@/components/content/MarkdownPage";

export default async function AboutPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("about")]);
  return <MarkdownPage pageKey="ABOUT" locale={locale} footer={(date) => t("updated", { date })} />;
}
