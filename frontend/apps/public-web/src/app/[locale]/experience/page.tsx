import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pageAlternates, pageMetadata } from "@/lib/seo";
import { Chip } from "@/components/content/Chip";
import { PageHero } from "@/components/content/PageHero";
import { Highlights } from "@/features/experience/Highlights";
import { yearOf, yearRange } from "@/features/experience/years";
import { Link } from "@/i18n/navigation";
import { getExperience, getProfile } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();
  return pageMetadata({
    locale,
    title: t("experience.title"),
    description: t("experience.intro"),
    alternates: pageAlternates("/experience", locale),
    siteName: t("site.name"),
  });
}

// The timeline (C-Experience): dates, company and role on the left, the projects as cards on the right
export default async function ExperiencePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const [experience, profile] = await Promise.all([getExperience(locale), getProfile(locale)]);
  const present = t("dates.present");
  const education = profile?.education ?? [];

  return (
    <div className="flex flex-col gap-18">
      <PageHero title={t("experience.title")}>{t("experience.intro")}</PageHero>

      {experience.length === 0 ? (
        <p className="text-muted-foreground">{t("experience.empty")}</p>
      ) : (
        <ol className="flex flex-col">
          {experience.map((job) => (
            <li
              key={`${job.company}-${job.startMonth}`}
              className="flex flex-wrap gap-x-12 gap-y-6 border-t py-10"
            >
              <div className="flex flex-[1_1_220px] flex-col gap-2">
                <span className="font-mono text-[13px] text-link">
                  {yearRange(yearOf(job.startMonth) ?? 0, yearOf(job.endMonth), present)}
                </span>
                <h2 className="text-[26px] leading-tight font-bold tracking-tight">
                  {job.company}
                </h2>
                <span lang={job.lang} className="text-base text-muted-foreground">
                  {job.roleTitle}
                </span>
              </div>
              <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
                {job.projects.map((project) => (
                  <article
                    key={project.slug}
                    lang={project.lang}
                    className="flex flex-col gap-3.5 rounded-2xl border bg-card px-7 py-6"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                      <h3 className="text-[19px] font-semibold tracking-tight">{project.name}</h3>
                      {project.client && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {project.client}
                        </span>
                      )}
                    </div>
                    {project.highlightsMd && <Highlights markdown={project.highlightsMd} />}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {project.technologies.map((technology) => (
                          <Chip key={technology}>{technology}</Chip>
                        ))}
                      </div>
                      {project.hasCaseStudy && (
                        <Link
                          href={`/experience/${project.slug}`}
                          className="text-sm font-semibold text-link no-underline"
                        >
                          {t("experience.caseStudy")} →
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      {education.length > 0 && (
        <section className="flex flex-wrap gap-x-12 gap-y-6 border-t py-10">
          <h2 className="flex-[1_1_220px] text-[26px] font-bold tracking-tight">
            {t("experience.education")}
          </h2>
          <ul className="flex flex-[999_1_520px] flex-col gap-6">
            {education.map((entry, position) => (
              <li key={position} className="flex flex-col gap-1">
                <span className="font-mono text-[13px] text-link">
                  {yearRange(entry.startYear, entry.endYear, present)}
                </span>
                <span lang={entry.lang} className="text-[19px] font-semibold">
                  {entry.degree}
                </span>
                <span className="text-base text-muted-foreground">{entry.school}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
