export type PostStatus = "DRAFT" | "PUBLISHED";

export interface ListParams {
  page: number;
  status: PostStatus | undefined;
}

const statuses: readonly string[] = ["DRAFT", "PUBLISHED"];

// The list's page and filter live in the address (like Angular's queryParams), so Back and reload keep them.
// Anything unexpected falls back to the first page of all posts.
export function readListParams(params: URLSearchParams): ListParams {
  const page = Number(params.get("page"));
  const status = params.get("status");
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    status: status && statuses.includes(status) ? (status as PostStatus) : undefined,
  };
}

export function listSearch({ page, status }: ListParams) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  if (status) {
    params.set("status", status);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}
