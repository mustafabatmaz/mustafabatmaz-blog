import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import { fromTranslations, toTranslations, translationsSchema } from "@/lib/translations";

export type UsesItem = Schemas["UsesItemAdminResponse"];
export type UsesCategory = NonNullable<UsesItem["category"]>;

// The backend's enum order, which is also the order categories appear in on the site
export const CATEGORIES = [
  "HARDWARE",
  "DEV_TOOLS",
  "SOFTWARE",
  "SERVICES",
] as const satisfies readonly UsesCategory[];

// Typed against the spec: a new backend category breaks the build here until it gets a label
export const categoryLabels: Record<UsesCategory, string> = tr.uses.categories;

// Same rule as the backend (http(s) only, so no javascript: links); the link is optional
const httpUrl = /^https?:\/\/\S+$/;

export const usesItemSchema = z.object({
  category: z.enum(CATEGORIES),
  url: z
    .string()
    .trim()
    .max(500, tr.form.tooLong(500))
    .refine((value) => value === "" || httpUrl.test(value), tr.form.invalidUrl),
  translations: translationsSchema(
    {
      name: z.string().max(100, tr.form.tooLong(100)),
      description: z.string().max(500, tr.form.tooLong(500)),
    },
    ["name"],
  ),
});

export type UsesItemFormValues = z.input<typeof usesItemSchema>;

// null: a new item
export function fromUsesItem(item: UsesItem | null): UsesItemFormValues {
  return {
    category: item?.category ?? "HARDWARE",
    url: item?.url ?? "",
    translations: fromTranslations(item?.translations, { name: "", description: "" }),
  };
}

export function toUsesRequest(
  values: z.output<typeof usesItemSchema>,
  version: number | undefined,
): Schemas["UsesItemAdminRequest"] {
  return {
    category: values.category,
    url: values.url || undefined,
    translations: toTranslations(values.translations).map(({ lang, name, description }) => ({
      lang,
      name: name ?? "",
      ...(description ? { description } : {}),
    })),
    version,
  };
}

// Turkish name first, English if that's all there is
export function displayName(item: UsesItem) {
  const byLang = (lang: "tr" | "en") => item.translations?.find((t) => t.lang === lang)?.name;
  return byLang("tr") ?? byLang("en") ?? tr.uses.unnamed;
}
