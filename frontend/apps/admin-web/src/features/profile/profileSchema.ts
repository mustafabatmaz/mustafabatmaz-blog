import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import {
  fromTranslations,
  LANGUAGES,
  toTranslations,
  translationsSchema,
} from "@/lib/translations";

type Profile = Schemas["ProfileAdminResponse"];
type Platform = Schemas["SocialLinkDto"]["platform"];

export const PLATFORMS = [
  "LINKEDIN",
  "GITHUB",
  "X",
  "MEDIUM",
  "STACKOVERFLOW",
] as const satisfies readonly Platform[];

// Typed against the spec: a platform added to the backend breaks the build here until it gets a label
export const platformLabels: Record<Platform, string> = tr.platforms;

// Same rule as the backend's validation (http(s) only, so no javascript: links)
const httpUrl = /^https?:\/\/\S+$/;

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, tr.form.required).max(100, tr.form.tooLong(100)),
  email: z
    .string()
    .trim()
    .max(254, tr.form.tooLong(254))
    .refine((value) => value === "" || z.email().safeParse(value).success, tr.form.invalidEmail),
  location: z.string().trim().max(100, tr.form.tooLong(100)),
  translations: translationsSchema(
    {
      headline: z.string().max(150, tr.form.tooLong(150)),
      intro: z.string().max(2000, tr.form.tooLong(2000)),
    },
    ["headline"],
  ),
  socialLinks: z.array(
    z.object({
      platform: z.enum(PLATFORMS),
      url: z.string().trim().max(500, tr.form.tooLong(500)).regex(httpUrl, tr.form.invalidUrl),
    }),
  ),
  // Years are select values (strings); an empty end year means still studying
  education: z.array(
    z
      .object({
        school: z.string().trim().min(1, tr.form.required).max(150, tr.form.tooLong(150)),
        startYear: z.string().min(1, tr.form.required),
        endYear: z.string(),
        degree: z.object({
          tr: z.string().trim().max(150, tr.form.tooLong(150)),
          en: z.string().trim().max(150, tr.form.tooLong(150)),
        }),
      })
      .superRefine((entry, ctx) => {
        if (entry.endYear && entry.startYear && Number(entry.endYear) < Number(entry.startYear)) {
          ctx.addIssue({
            code: "custom",
            path: ["endYear"],
            message: tr.profile.endYearBeforeStart,
          });
        }
        if (!entry.degree.tr && !entry.degree.en) {
          ctx.addIssue({
            code: "custom",
            path: ["degree", "tr"],
            message: tr.profile.degreeRequired,
          });
        }
      }),
  ),
});

export type ProfileFormValues = z.input<typeof profileSchema>;
type ValidProfile = z.output<typeof profileSchema>;

// null: the profile was never saved, so the form starts empty
export function fromProfile(profile: Profile | null): ProfileFormValues {
  return {
    fullName: profile?.fullName ?? "",
    email: profile?.email ?? "",
    location: profile?.location ?? "",
    translations: fromTranslations(profile?.translations, { headline: "", intro: "" }),
    socialLinks: (profile?.socialLinks ?? []).map(({ platform, url }) => ({ platform, url })),
    education: (profile?.education ?? []).map((entry) => ({
      school: entry.school,
      startYear: String(entry.startYear),
      endYear: entry.endYear ? String(entry.endYear) : "",
      degree: {
        tr: entry.translations.find((t) => t.lang === "tr")?.degree ?? "",
        en: entry.translations.find((t) => t.lang === "en")?.degree ?? "",
      },
    })),
  };
}

// The whole record goes back with the version it was loaded with (PUT + optimistic locking)
export function toProfileRequest(
  values: ValidProfile,
  version: number | undefined,
): Schemas["ProfileAdminRequest"] {
  return {
    fullName: values.fullName,
    email: values.email || undefined,
    location: values.location || undefined,
    translations: toTranslations(values.translations).map(({ lang, headline, intro }) => ({
      lang,
      headline: headline ?? "",
      ...(intro ? { intro } : {}),
    })),
    socialLinks: values.socialLinks,
    education: values.education.map(({ school, startYear, endYear, degree }) => ({
      school,
      startYear: Number(startYear),
      ...(endYear ? { endYear: Number(endYear) } : {}),
      translations: LANGUAGES.filter((lang) => degree[lang]).map((lang) => ({
        lang,
        degree: degree[lang],
      })),
    })),
    version,
  };
}
