import { useParams } from "react-router";
import { NotFound } from "@/components/layout/NotFound";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { tr } from "@/i18n/tr";
import { PageForm } from "./PageForm";
import { pageKeyFromSlug, type PageKey } from "./pageSchema";
import { PageSwitch } from "./PageSwitch";
import { usePage } from "./usePage";

export function PagesPage() {
  const { slug } = useParams();
  const key = pageKeyFromSlug(slug);
  if (!key) {
    return <NotFound />;
  }
  // key={key}: switching from About to Now mounts a fresh editor with its own form state.
  // (Hooks live in PageEditor so they never run after the early return above.)
  return <PageEditor key={key} pageKey={key} />;
}

function PageEditor({ pageKey }: { pageKey: PageKey }) {
  const page = usePage(pageKey);

  if (page.isSuccess) {
    return <PageForm pageKey={pageKey} page={page.data} />;
  }
  return (
    <>
      <PageHeader kicker={tr.nav.profileGroup} title={tr.pages.title} />
      <PageSwitch />
      {page.isError ? <LoadError onRetry={() => void page.refetch()} /> : <Loading />}
    </>
  );
}
