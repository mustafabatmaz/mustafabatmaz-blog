import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

// Pages other than posts fall back to the other language when theirs is missing (§10); this says so, in the
// visitor's language, above the content (public canvas, "Şimdi" draft)
export async function LanguageNotice({ contentLang }: { contentLang: Locale }) {
  const locale = await getLocale();
  if (contentLang === locale) {
    return null;
  }
  const t = await getTranslations("notice");
  return (
    <aside className="flex max-w-175 flex-col gap-2 rounded-[18px] bg-secondary px-6 py-5">
      <span className="font-mono text-xs text-secondary-foreground">{t("label")}</span>
      <p className="text-base leading-relaxed">
        {t("otherLanguage", { language: t(`languages.${contentLang}`) })}
      </p>
    </aside>
  );
}
