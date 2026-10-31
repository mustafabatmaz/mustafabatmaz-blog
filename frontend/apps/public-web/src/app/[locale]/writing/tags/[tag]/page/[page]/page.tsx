import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";

export default async function TagListPage({
  params,
}: PageProps<"/[locale]/writing/tags/[tag]/page/[page]">) {
  const { tag, page } = await params;
  return <WritingList locale={await getLocale()} tag={tag} pageParam={page} />;
}
