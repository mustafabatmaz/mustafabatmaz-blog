import { z } from "zod";
import { tr } from "@/i18n/tr";

export const LANGUAGES = ["tr", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

// Forms keep one object per language; the API wants a list with a lang field
export type ByLanguage<T> = Record<Language, T>;
type TextFields = Record<string, string>;

function isBlank(fields: TextFields) {
  return Object.values(fields).every((value) => value.trim() === "");
}

// Form → API. A language left completely blank is not sent (content may exist in one language only);
// blank optional fields are left out rather than sent as "".
export function toTranslations<T extends TextFields>(byLanguage: ByLanguage<T>) {
  return LANGUAGES.filter((lang) => !isBlank(byLanguage[lang])).map((lang) => {
    const filled = Object.entries(byLanguage[lang]).filter(([, value]) => value.trim() !== "");
    return { lang, ...(Object.fromEntries(filled) as Partial<T>) };
  });
}

// API → form. Missing languages and fields (absent or null) become empty strings so every input is controlled.
export function fromTranslations<T extends TextFields>(
  translations:
    readonly ({ lang?: Language } & { [K in keyof T]?: string | null | undefined })[] | undefined,
  empty: T,
): ByLanguage<T> {
  const result = { tr: { ...empty }, en: { ...empty } };
  for (const translation of translations ?? []) {
    if (!translation.lang) {
      continue;
    }
    const target: TextFields = result[translation.lang];
    for (const key of Object.keys(empty)) {
      target[key] = translation[key] ?? "";
    }
  }
  return result;
}

// Both languages share one shape. At least one language must be filled; a filled language needs its
// required fields. Errors point at the field so the form can show them in the right tab.
export function translationsSchema<S extends Record<string, z.ZodString>>(
  fields: S,
  required: readonly (keyof S & string)[],
) {
  const language = z.object(fields);
  return z.object({ tr: language, en: language }).superRefine((value, ctx) => {
    const byLanguage = value as ByLanguage<TextFields>;
    const filled = LANGUAGES.filter((lang) => !isBlank(byLanguage[lang]));
    if (filled.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["tr", required[0] ?? ""],
        message: tr.form.oneLanguageRequired,
      });
    }
    for (const lang of filled) {
      for (const key of required) {
        if (!byLanguage[lang][key].trim()) {
          ctx.addIssue({ code: "custom", path: [lang, key], message: tr.form.required });
        }
      }
    }
  });
}

// After a failed submit the form switches to the first language tab that has errors
export function firstLanguageWithErrors(errors: Partial<Record<Language, unknown>> | undefined) {
  return LANGUAGES.find((language) => errors?.[language]);
}
