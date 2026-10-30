import { PlusIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { formatDate } from "@/lib/format";
import { readListParams, type ListParams, type PostStatus } from "./listParams";
import { postTitle, type PostSummary } from "./postSchema";
import { postState } from "./publishing";
import { usePostList } from "./usePosts";

const stateTones = { draft: "muted", published: "mint", scheduled: "accent" } as const;

const filters: { value: PostStatus | undefined; label: string }[] = [
  { value: undefined, label: tr.posts.filters.all },
  { value: "DRAFT", label: tr.posts.filters.DRAFT },
  { value: "PUBLISHED", label: tr.posts.filters.PUBLISHED },
];

export function PostsPage() {
  // useSearchParams reads and writes the query string, like Angular's ActivatedRoute.queryParams + router.navigate
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readListParams(searchParams);
  const posts = usePostList(params);

  const go = (next: ListParams) => {
    const search = new URLSearchParams();
    if (next.page > 1) {
      search.set("page", String(next.page));
    }
    if (next.status) {
      search.set("status", next.status);
    }
    setSearchParams(search);
  };

  const data = posts.data;
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      <PageHeader
        kicker={data ? tr.posts.count(data.totalItems ?? 0) : tr.nav.content}
        title={tr.posts.title}
        actions={
          <Button render={<Link to="/posts/new" />}>
            <PlusIcon aria-hidden="true" />
            {tr.posts.newPost}
          </Button>
        }
      />

      <div role="group" aria-label={tr.posts.statusFilter} className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={params.status === option.value}
            className={cn(
              "h-9 rounded-full border px-4 text-sm font-semibold",
              params.status === option.value
                ? "border-foreground bg-foreground text-background"
                : "border-input text-foreground hover:bg-muted",
            )}
            onClick={() => {
              go({ page: 1, status: option.value });
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {posts.isPending && <Loading />}
      {posts.isError && <LoadError onRetry={() => void posts.refetch()} />}
      {posts.isSuccess && items.length === 0 && (
        <p className="text-muted-foreground">
          {params.status ? tr.posts.emptyFilter : tr.posts.empty}
        </p>
      )}

      {items.length > 0 && (
        <>
          {/* The table scrolls in its own box on narrow screens */}
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-180 border-collapse text-[15px]">
              <thead>
                <tr className="text-left font-mono text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-3.5 font-normal">
                    {tr.posts.columns.title}
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-normal">
                    {tr.posts.columns.languages}
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-normal">
                    {tr.posts.columns.status}
                  </th>
                  <th scope="col" className="px-3 py-3.5 font-normal">
                    {tr.posts.columns.published}
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-normal">
                    {tr.posts.columns.updated}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <PostRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label={tr.posts.pagination}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <span className="font-mono text-[13px] text-muted-foreground">
              {tr.posts.pageOf(params.page, Math.max(totalPages, 1))}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={params.page <= 1}
                onClick={() => {
                  go({ ...params, page: params.page - 1 });
                }}
              >
                {tr.posts.previous}
              </Button>
              <Button
                variant="outline"
                disabled={params.page >= totalPages}
                onClick={() => {
                  go({ ...params, page: params.page + 1 });
                }}
              >
                {tr.posts.next}
              </Button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function PostRow({ item }: { item: PostSummary }) {
  const state = postState(item);
  const languages = new Set((item.translations ?? []).map((t) => t.lang));
  return (
    <tr className="border-t">
      <td className="px-5 py-4">
        <Link
          to={`/posts/${String(item.id)}`}
          className="leading-snug font-semibold hover:underline"
        >
          {postTitle(item.translations)}
        </Link>
      </td>
      <td className="px-3 py-4 font-mono text-xs whitespace-nowrap">
        <span className={languages.has("tr") ? "" : "text-muted-foreground"}>
          {languages.has("tr") ? "TR" : "—"}
        </span>{" "}
        <span className={languages.has("en") ? "" : "text-muted-foreground"}>
          {languages.has("en") ? "EN" : "—"}
        </span>
      </td>
      <td className="px-3 py-4">
        <StatusBadge tone={stateTones[state]}>{tr.posts.states[state]}</StatusBadge>
      </td>
      <td className="px-3 py-4 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
        {item.publishedAt ? formatDate(item.publishedAt) : "—"}
      </td>
      <td className="px-5 py-4 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
        {item.updatedAt ? formatDate(item.updatedAt) : "—"}
      </td>
    </tr>
  );
}
