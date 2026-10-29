import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import { fromTranslations, toTranslations, translationsSchema } from "@/lib/translations";

type Page = Schemas["PageAdminResponse"];
export type PageKey = NonNullable<Page["key"]>;

// URL slug → API key; the public site uses the same paths (/about, /now)
const pageKeys = { about: "ABOUT", now: "NOW" } as const satisfies Record<string, PageKey>;
export type PageSlug = keyof typeof pageKeys;
export const PAGE_SLUGS = Object.keys(pageKeys) as PageSlug[];

export function pageKeyFromSlug(slug: string | undefined): PageKey | undefined {
  return slug && slug in pageKeys ? pageKeys[slug as PageSlug] : undefined;
}

export const pageSchema = z.object({
  translations: translationsSchema(
    {
      title: z.string().max(200, tr.form.tooLong(200)),
      bodyMd: z.string().max(50000, tr.form.tooLong(50000)),
    },
    ["title", "bodyMd"],
  ),
});

export type PageFormValues = z.input<typeof pageSchema>;

export function fromPage(page: Page | null): PageFormValues {
  return { translations: fromTranslations(page?.translations, { title: "", bodyMd: "" }) };
}

export function toPageRequest(
  values: z.output<typeof pageSchema>,
  version: number | undefined,
): Schemas["PageAdminRequest"] {
  return {
    translations: toTranslations(values.translations).map(({ lang, title, bodyMd }) => ({
      lang,
      title: title ?? "",
      bodyMd: bodyMd ?? "",
    })),
    version,
  };
}
