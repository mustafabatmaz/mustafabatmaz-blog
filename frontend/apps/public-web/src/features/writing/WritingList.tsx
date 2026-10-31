import { cn } from "cn";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/content/PageHero";
import { pillOutline } from "@/components/layout/pill";
import { Link, permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPosts, getTags } from "@/lib/content";
import { parsePage } from "./listParams";

// The post list (public canvas, "Yazılar listesi" draft). Page and tag live in the path, not the query, so
// every list page is cached like the rest of the site (5c decision 7):
//   /writing, /writing/page/2, /writing/tags/kafka, /writing/tags/kafka/page/2
export async function WritingList({
  locale,
  pageParam,
  tag,
}: {
  locale: Locale;
  pageParam?: string;
  tag?: string;
}) {
  const base = tag ? `/writing/tags/${tag}` : "/writing";
  const page = pageParam === undefined ? 1 : parsePage(pageParam);
  if (page === null) {
    notFound();
  }
  // One address per page: /writing/page/1 is /writing
  if (pageParam !== undefined && page === 1) {
    permanentRedirect({ href: base, locale });
  }

  const [tags, posts, t, format] = await Promise.all([
    getTags(locale),
    getPosts(locale, page, tag),
    getTranslations("writing"),
    getFormatter(),
  ]);
  const selected = tag ? tags.find((candidate) => candidate.slug === tag) : undefined;
  // An unknown tag or a page past the end has no content of its own
  if ((tag && !selected) || !posts || (page > 1 && page > posts.totalPages)) {
    notFound();
  }
  const pageHref = (number: number) => (number === 1 ? base : `${base}/page/${String(number)}`);
  const other = locale === "tr" ? "en" : "tr";

  return (
    <div className="flex flex-col gap-12">
      <PageHero title={t("title")}>{t("intro")}</PageHero>

      {tags.length > 0 && (
        <nav aria-label={t("tags")}>
          <ul className="flex flex-wrap gap-2">
            {[{ name: t("all"), slug: undefined, postCount: undefined }, ...tags].map((item) => {
              const current = item.slug === tag;
              return (
                <li key={item.slug ?? ""}>
                  <Link
                    href={item.slug ? `/writing/tags/${item.slug}` : "/writing"}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full px-3.5 font-mono text-[13px] no-underline",
                      current
                        ? "bg-primary text-primary-foreground"
                        : "bg-mint text-mint-foreground",
                    )}
                  >
                    {item.name}
                    {item.postCount !== undefined && (
                      <span className="opacity-70">{item.postCount}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {posts.items.length === 0 ? (
        <p className="text-muted-foreground">
          {t("empty")}{" "}
          <Link href="/writing" locale={other} className="text-link">
            {t("otherLanguageList")}
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {selected && (
            <p className="font-mono text-[13px] text-muted-foreground">
              {t("filtered", { tag: selected.slug, count: selected.postCount })} ·{" "}
              <Link href="/writing" className="text-link">
                {t("clearFilter")}
              </Link>
            </p>
          )}
          <ol className="flex flex-col">
            {posts.items.map((post) => (
              <li key={post.slug} className="border-t">
                <Link
                  href={`/writing/${post.slug}`}
                  className="flex flex-wrap gap-x-10 gap-y-2 py-7 text-foreground no-underline"
                >
                  <time
                    dateTime={post.publishedAt}
                    className="flex-[0_0_140px] pt-1 font-mono text-[13px] text-link"
                  >
                    {format.dateTime(new Date(post.publishedAt), {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <span className="flex min-w-0 flex-[1_1_480px] flex-col gap-2.5">
                    <span className="text-[22px] leading-snug font-semibold tracking-tight">
                      {post.title}
                    </span>
                    {post.summary && (
                      <span className="text-base leading-relaxed text-muted-foreground">
                        {post.summary}
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {post.tags.map((postTag) => (
                        <span
                          key={postTag.slug}
                          className="rounded-full bg-mint px-2.5 py-1 font-mono text-[11px] text-mint-foreground"
                        >
                          {postTag.name}
                        </span>
                      ))}
                      <span className="font-mono text-xs text-muted-foreground">
                        {t("minutes", { count: post.readingMinutes })}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {posts.totalPages > 1 && (
        <nav
          aria-label={t("pages")}
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-6"
        >
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={pillOutline}>
              {t("previousPage")}
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-[13px] text-muted-foreground">
            {t("page", { page, total: posts.totalPages })}
          </span>
          {page < posts.totalPages ? (
            <Link href={pageHref(page + 1)} className={pillOutline}>
              {t("nextPage")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
