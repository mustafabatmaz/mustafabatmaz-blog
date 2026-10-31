import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";

export default async function WritingListPage({
  params,
}: PageProps<"/[locale]/writing/page/[page]">) {
  const { page } = await params;
  return <WritingList locale={await getLocale()} pageParam={page} />;
}
