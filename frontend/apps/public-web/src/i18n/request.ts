import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing, type Locale } from "./routing";

const messages = {
  tr: () => import("../../messages/tr.json"),
  en: () => import("../../messages/en.json"),
} satisfies Record<Locale, () => Promise<unknown>>;

// Which language a Server Component renders in. The [locale] segment is read through next/root-params
// (Next 16.3+), so pages don't have to call setRequestLocale (5a decision 4). Unknown prefixes are a 404.
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const fromPath = await rootParams.locale();
    if (!hasLocale(routing.locales, fromPath)) {
      notFound();
    }
    locale = fromPath;
  }
  return { locale, messages: (await messages[locale]()).default };
});
