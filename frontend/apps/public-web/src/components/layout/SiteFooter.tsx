import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("site");
  return (
    <footer className="flex flex-wrap justify-between gap-3 border-t pt-6 text-sm text-muted-foreground">
      <span>
        © {new Date().getFullYear()} {t("name")}
      </span>
      <span className="font-mono text-xs">{t("techLine")}</span>
    </footer>
  );
}
