import type { Locale } from "@/i18n/routing";

// An RSS 2.0 feed of a language's latest posts: title, link and summary, not the full text (5d decision 3)
type FeedPost = {
  slug: string;
  title: string;
  summary?: string | null | undefined;
  publishedAt: string;
  tags: readonly { name: string }[];
};

function escape(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildRss({
  site,
  locale,
  title,
  description,
  posts,
}: {
  site: URL;
  locale: Locale;
  title: string;
  description: string;
  posts: readonly FeedPost[];
}) {
  const absolute = (path: string) => new URL(path, site).href;
  const items = posts.map((post) => {
    const link = absolute(`/${locale}/writing/${post.slug}`);
    return [
      "    <item>",
      `      <title>${escape(post.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
      ...(post.summary ? [`      <description>${escape(post.summary)}</description>`] : []),
      ...post.tags.map((tag) => `      <category>${escape(tag.name)}</category>`),
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escape(title)}</title>`,
    `    <link>${absolute(`/${locale}/writing`)}</link>`,
    `    <description>${escape(description)}</description>`,
    `    <language>${locale}</language>`,
    `    <atom:link href="${absolute(`/${locale}/rss.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
