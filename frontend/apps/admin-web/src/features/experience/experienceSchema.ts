import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import { fromTranslations, toTranslations, translationsSchema } from "@/lib/translations";
import { fromYearMonth, toYearMonth } from "./yearMonth";

export type Experience = Schemas["ExperienceAdminResponse"];
export type Project = Schemas["ProjectAdminResponse"];

const monthYear = z.object({ month: z.string(), year: z.string() });

export const experienceSchema = z
  .object({
    company: z.string().trim().min(1, tr.form.required).max(100, tr.form.tooLong(100)),
    start: monthYear,
    current: z.boolean(),
    end: monthYear,
    translations: translationsSchema(
      {
        roleTitle: z.string().max(150, tr.form.tooLong(150)),
        summary: z.string().max(2000, tr.form.tooLong(2000)),
      },
      ["roleTitle"],
    ),
  })
  // Same rule as the backend: the end can't come before the start ("2024-01" < "2025-06" as text, too)
  .superRefine((value, ctx) => {
    const start = toYearMonth(value.start);
    const end = toYearMonth(value.end);
    if (!start) {
      ctx.addIssue({ code: "custom", path: ["start"], message: tr.experience.startRequired });
    }
    if (!value.current && !end) {
      ctx.addIssue({ code: "custom", path: ["end"], message: tr.experience.endRequired });
    }
    if (!value.current && start && end && end < start) {
      ctx.addIssue({ code: "custom", path: ["end"], message: tr.experience.endBeforeStart });
    }
  });

export type ExperienceFormValues = z.input<typeof experienceSchema>;

// null: a new experience
export function fromExperience(experience: Experience | null): ExperienceFormValues {
  return {
    company: experience?.company ?? "",
    start: fromYearMonth(experience?.startMonth),
    current: experience ? !experience.endMonth : false,
    end: fromYearMonth(experience?.endMonth),
    translations: fromTranslations(experience?.translations, { roleTitle: "", summary: "" }),
  };
}

export function toExperienceRequest(
  values: z.output<typeof experienceSchema>,
  version: number | undefined,
): Schemas["ExperienceAdminRequest"] {
  return {
    company: values.company,
    startMonth: toYearMonth(values.start) ?? "",
    endMonth: values.current ? undefined : toYearMonth(values.end),
    translations: toTranslations(values.translations).map(({ lang, roleTitle, summary }) => ({
      lang,
      roleTitle: roleTitle ?? "",
      ...(summary ? { summary } : {}),
    })),
    version,
  };
}

// Turkish first, English if that's all there is
function pick<T extends { lang: "tr" | "en" }>(translations: readonly T[] | undefined) {
  return translations?.find((t) => t.lang === "tr") ?? translations?.find((t) => t.lang === "en");
}

export function roleOf(experience: Experience) {
  return pick(experience.translations)?.roleTitle ?? "";
}

export function projectName(project: Project) {
  return pick(project.translations)?.name ?? tr.uses.unnamed;
}

export function hasCaseStudy(project: Project) {
  return (project.translations ?? []).some((t) => t.caseStudyMd?.trim());
}
