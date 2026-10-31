import { getLocale, getTranslations } from "next-intl/server";
import { MarkdownPage } from "@/components/content/MarkdownPage";

export default async function NowPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("now")]);
  return (
    <MarkdownPage
      pageKey="NOW"
      locale={locale}
      label={(date) => t("updated", { date })}
      subtitle={t("subtitle")}
    />
  );
}
