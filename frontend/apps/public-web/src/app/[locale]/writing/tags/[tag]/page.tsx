import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";
import { writingListMetadata } from "@/lib/pageMeta";

export async function generateMetadata({ params }: PageProps<"/[locale]/writing/tags/[tag]">) {
  const { tag } = await params;
  return writingListMetadata(`/writing/tags/${tag}`);
}

export default async function TagPage({ params }: PageProps<"/[locale]/writing/tags/[tag]">) {
  const { tag } = await params;
  return <WritingList locale={await getLocale()} tag={tag} />;
}
