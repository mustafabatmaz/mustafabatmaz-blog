import { getTranslations } from "next-intl/server";
import { PageNotice } from "@/components/layout/PageNotice";
import { pillOutline, pillPrimary } from "@/components/layout/pill";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <PageNotice label="404" title={t("title")} text={t("text")}>
      <Link href="/" className={pillPrimary}>
        {t("home")}
      </Link>
      <Link href="/writing" className={pillOutline}>
        {t("writing")}
      </Link>
    </PageNotice>
  );
}
