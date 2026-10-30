import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import { fromTranslations, toTranslations } from "@/lib/translations";

export type MediaItem = Schemas["MediaAdminResponse"];

const MAX_ALT_TEXT = 300;

// Alt text is optional in every language (unlike other forms, both may stay blank: a decorative image)
const language = z.object({
  altText: z.string().trim().max(MAX_ALT_TEXT, tr.form.tooLong(MAX_ALT_TEXT)),
});

export const mediaSchema = z.object({
  translations: z.object({ tr: language, en: language }),
});

export type MediaFormValues = z.input<typeof mediaSchema>;

// The public site falls back to the other language, so one language is enough
export function hasAltText(media: Pick<MediaItem, "translations">) {
  return media.translations?.some((t) => t.altText.trim() !== "") ?? false;
}

export function mediaName(media: MediaItem) {
  return media.originalFilename ?? tr.media.unnamed;
}

// "TR EN": the languages that have alt text
export function altLanguages(media: Pick<MediaItem, "translations">) {
  return (media.translations ?? [])
    .filter((t) => t.altText.trim() !== "")
    .map((t) => t.lang.toUpperCase())
    .join(" ");
}

export function fromMedia(media: Pick<MediaItem, "translations">): MediaFormValues {
  return { translations: fromTranslations(media.translations, { altText: "" }) };
}

// An empty list removes every alt text
export function toMediaRequest(
  values: z.output<typeof mediaSchema>,
  version: number | undefined,
): Schemas["MediaAdminRequest"] {
  return {
    translations: toTranslations(values.translations).map(({ lang, altText }) => ({
      lang,
      altText: altText ?? "",
    })),
    version,
  };
}
