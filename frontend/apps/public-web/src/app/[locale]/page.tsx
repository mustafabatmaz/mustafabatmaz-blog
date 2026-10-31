import { getTranslations } from "next-intl/server";

// Placeholder until the home page (C-Home) arrives in 5b
export default async function HomePage() {
  const t = await getTranslations("site");
  return <h1 className="text-[52px] leading-tight font-bold tracking-tighter">{t("name")}</h1>;
}
