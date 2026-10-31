import { getFormatter, getTranslations } from "next-intl/server";
import { getPost } from "@/lib/content";
import { ogSize, pageCard, postCard } from "@/lib/og";
import { ogContentType, ogLocale } from "@/lib/ogPages";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Mustafa Batmaz";
// Titles rarely change, and networks keep the image long after they first fetch it
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const locale = await ogLocale(params);
  const { slug } = await params;
  const [post, t, format] = await Promise.all([
    getPost(slug, locale).catch(() => null),
    getTranslations({ locale }),
    getFormatter({ locale }),
  ]);
  if (!post) {
    return pageCard({ name: t("site.name"), label: "/writing", title: t("writing.title") });
  }
  return postCard({
    name: t("site.name"),
    title: post.title,
    tags: post.tags.map((tag) => tag.slug),
    meta: `${format.dateTime(new Date(post.publishedAt), { dateStyle: "long" })} · ${t("writing.minutes", { count: post.readingMinutes })}`,
  });
}
