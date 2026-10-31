import { MarkdownArticle } from "@blog/markdown";
import { getFormatter } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import { LanguageNotice } from "./LanguageNotice";
import { PageHero } from "./PageHero";

// About and Now: a title and a markdown body edited in the admin panel (public canvas, "Faz 5b" drafts).
// A page that was never saved is a 404.
export async function MarkdownPage({
  pageKey,
  locale,
  label,
  subtitle,
  footer,
}: {
  pageKey: "ABOUT" | "NOW";
  locale: Locale;
  label?: (updated: string) => string;
  subtitle?: string;
  footer?: (updated: string) => string;
}) {
  const page = await getPage(pageKey, locale);
  if (!page) {
    notFound();
  }
  const format = await getFormatter();
  const updated = format.dateTime(new Date(page.updatedAt), { dateStyle: "long" });

  return (
    <div className="flex flex-col gap-12">
      <PageHero title={page.title} lang={page.lang} label={label?.(updated)}>
        {subtitle}
      </PageHero>
      <LanguageNotice contentLang={page.lang} />
      <article lang={page.lang} className="flex max-w-175 flex-col gap-7">
        <MarkdownArticle markdown={page.bodyMd} />
        {footer && (
          <p className="border-t pt-6 font-mono text-xs text-muted-foreground">{footer(updated)}</p>
        )}
      </article>
    </div>
  );
}
