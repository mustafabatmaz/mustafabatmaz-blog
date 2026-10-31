import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";

export default async function TagPage({ params }: PageProps<"/[locale]/writing/tags/[tag]">) {
  const { tag } = await params;
  return <WritingList locale={await getLocale()} tag={tag} />;
}
