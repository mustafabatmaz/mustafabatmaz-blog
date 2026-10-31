import { extractHeadings, HighlightedMarkdownArticle } from "@blog/markdown";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Chip } from "@/components/content/Chip";
import { LanguageNotice } from "@/components/content/LanguageNotice";
import { pillOutline } from "@/components/layout/pill";
import { Highlights } from "@/features/experience/Highlights";
import { ArticleLayout } from "@/features/writing/ArticleLayout";
import { yearOf, yearRange } from "@/features/experience/years";
import { Link } from "@/i18n/navigation";
import { getCaseStudy } from "@/lib/content";

// A project's case study (public canvas, "Vaka analizi" draft), laid out like a post with its table of contents
export default async function CaseStudyPage({ params }: PageProps<"/[locale]/experience/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const [study, t] = await Promise.all([getCaseStudy(slug, locale), getTranslations()]);
  if (!study) {
    notFound();
  }

  return (
    <ArticleLayout
      headings={extractHeadings(study.caseStudyMd)}
      label={t("writing.contents")}
      header={
        <>
          <Link href="/experience" className="font-mono text-[13px] text-link no-underline">
            ← {t("experience.back")}
          </Link>
          <LanguageNotice contentLang={study.lang} />
          <div lang={study.lang} className="flex flex-col gap-7">
            <span className="font-mono text-[13px] text-link">
              {study.company} ·{" "}
              {yearRange(yearOf(study.startMonth) ?? 0, yearOf(study.endMonth), t("dates.present"))}
            </span>
            <h1 className="text-[40px] leading-[1.05] font-bold tracking-tighter sm:text-[52px]">
              {study.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b pb-7">
              {study.client && (
                <span className="font-mono text-[13px] text-muted-foreground">{study.client}</span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {study.technologies.map((technology) => (
                  <Chip key={technology}>{technology}</Chip>
                ))}
              </div>
            </div>
          </div>
        </>
      }
    >
      <div lang={study.lang} className="flex flex-col gap-7">
        {study.description && (
          <p className="text-[21px] leading-[1.6] font-medium">{study.description}</p>
        )}
        {study.highlightsMd && (
          <section className="flex flex-col gap-3.5 rounded-2xl border bg-card px-7 py-6">
            <h2 className="text-[19px] font-semibold">{t("experience.highlights")}</h2>
            <Highlights markdown={study.highlightsMd} />
          </section>
        )}
        <HighlightedMarkdownArticle markdown={study.caseStudyMd} />
      </div>
      <Link href="/experience" className={`${pillOutline} self-start`}>
        ← {t("experience.backAll")}
      </Link>
    </ArticleLayout>
  );
}
