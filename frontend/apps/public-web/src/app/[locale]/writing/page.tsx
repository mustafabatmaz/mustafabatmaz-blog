import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";
import { writingListMetadata } from "@/lib/pageMeta";

export function generateMetadata() {
  return writingListMetadata("/writing");
}

export default async function WritingPage() {
  return <WritingList locale={await getLocale()} />;
}
