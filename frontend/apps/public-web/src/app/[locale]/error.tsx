"use client";

import { useTranslations } from "next-intl";
import { PageNotice } from "@/components/layout/PageNotice";
import { pillOutline, pillPrimary } from "@/components/layout/pill";
import { Link } from "@/i18n/navigation";

// Client Component by Next's rule: it catches render errors in the browser too, and reset() retries the page
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <PageNotice label="500" title={t("title")} text={t("text")}>
      <button type="button" onClick={reset} className={pillPrimary}>
        {t("retry")}
      </button>
      <Link href="/" className={pillOutline}>
        {t("home")}
      </Link>
    </PageNotice>
  );
}
