import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";
import { writingListMetadata } from "@/lib/pageMeta";

export async function generateMetadata({ params }: PageProps<"/[locale]/writing/page/[page]">) {
  const { page } = await params;
  return writingListMetadata(`/writing/page/${page}`);
}

export default async function WritingListPage({
  params,
}: PageProps<"/[locale]/writing/page/[page]">) {
  const { page } = await params;
  return <WritingList locale={await getLocale()} pageParam={page} />;
}
