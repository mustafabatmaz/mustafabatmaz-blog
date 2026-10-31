import { extractHeadings } from "@blog/markdown";
import { HighlightedMarkdownArticle } from "@blog/markdown/highlighted";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/features/writing/ArticleLayout";
import { PostTags } from "@/features/writing/PostTags";
import { Link } from "@/i18n/navigation";
import { getPost } from "@/lib/content";

// A post (C-Post). Posts never fall back to the other language: a slug missing in this one is a 404.
export default async function PostPage({ params }: PageProps<"/[locale]/writing/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const [post, t, format] = await Promise.all([
    getPost(slug, locale),
    getTranslations("writing"),
    getFormatter(),
  ]);
  if (!post) {
    notFound();
  }
  const translation = post.availableTranslations.find((link) => link.lang !== post.lang);

  return (
    <div className="flex flex-col gap-16">
      <ArticleLayout
        headings={extractHeadings(post.bodyMd)}
        label={t("contents")}
        header={
          <>
            <Link href="/writing" className="font-mono text-[13px] text-link no-underline">
              ← {t("back")}
            </Link>
            <PostTags tags={post.tags} />
            <h1 className="text-[40px] leading-[1.05] font-bold tracking-tighter sm:text-[52px]">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-b pb-7 font-mono text-[13px] text-muted-foreground">
              <time dateTime={post.publishedAt}>
                {format.dateTime(new Date(post.publishedAt), { dateStyle: "long" })}
              </time>
              <span aria-hidden="true">·</span>
              <span>{t("minutes", { count: post.readingMinutes })}</span>
              {translation && (
                <>
                  <span aria-hidden="true">·</span>
                  <Link
                    href={`/writing/${translation.slug}`}
                    locale={translation.lang}
                    hrefLang={translation.lang}
                    lang={translation.lang}
                    className="text-link no-underline"
                  >
                    {t(`readIn.${translation.lang}`)} →
                  </Link>
                </>
              )}
            </div>
            {post.cover && (
              // A plain <img>: sizes aren't stored, and the file comes through the /api/public/media rewrite
              // (5c decision 6). It's the largest thing above the fold, so it loads first.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover.url}
                alt={post.cover.alt}
                loading="eager"
                fetchPriority="high"
                className="w-full rounded-[22px]"
              />
            )}
          </>
        }
      >
        <HighlightedMarkdownArticle markdown={post.bodyMd} />
        {(post.previous ?? post.next) && (
          <nav
            aria-label={t("otherPosts")}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4 border-t pt-8"
          >
            {post.previous && (
              <Link
                href={`/writing/${post.previous.slug}`}
                className="flex flex-col gap-1.5 rounded-[18px] border p-5 text-foreground no-underline"
              >
                <span className="font-mono text-xs text-muted-foreground">{t("previous")}</span>
                <span className="text-base leading-snug font-semibold">{post.previous.title}</span>
              </Link>
            )}
            {post.next && (
              <Link
                href={`/writing/${post.next.slug}`}
                className="col-start-[-2] flex flex-col gap-1.5 rounded-[18px] border p-5 text-right text-foreground no-underline"
              >
                <span className="font-mono text-xs text-muted-foreground">{t("next")}</span>
                <span className="text-base leading-snug font-semibold">{post.next.title}</span>
              </Link>
            )}
          </nav>
        )}
      </ArticleLayout>
    </div>
  );
}
