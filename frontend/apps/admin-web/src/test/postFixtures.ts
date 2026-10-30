import type { Schemas } from "@blog/api-client";

type Summary = Schemas["PostAdminSummary"];
type Post = Schemas["PostAdminResponse"];
type Page = Schemas["PageResponsePostAdminSummary"];

export function summary(id: number, title: string, extra: Partial<Summary> = {}): Summary {
  return {
    id,
    status: "DRAFT",
    scheduled: false,
    translations: [{ lang: "tr", slug: `yazi-${String(id)}`, title }],
    tags: [],
    version: 0,
    updatedAt: "2026-10-27T10:00:00Z",
    ...extra,
  };
}

export function page(items: Summary[], extra: Partial<Page> = {}): Page {
  return { items, page: 1, size: 20, totalItems: items.length, totalPages: 1, ...extra };
}

export function post(id: number, title: string, extra: Partial<Post> = {}): Post {
  return {
    id,
    status: "DRAFT",
    scheduled: false,
    translations: [
      {
        lang: "tr",
        slug: `yazi-${String(id)}`,
        title,
        summary: "",
        bodyMd: "## Giriş\n\nMetin.",
        readingMinutes: 1,
      },
    ],
    tags: [],
    version: 0,
    createdAt: "2026-10-27T10:00:00Z",
    updatedAt: "2026-10-27T10:00:00Z",
    ...extra,
  };
}
