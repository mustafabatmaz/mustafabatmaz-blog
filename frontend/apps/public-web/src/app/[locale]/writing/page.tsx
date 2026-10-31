import { getLocale } from "next-intl/server";
import { WritingList } from "@/features/writing/WritingList";

export default async function WritingPage() {
  return <WritingList locale={await getLocale()} />;
}
