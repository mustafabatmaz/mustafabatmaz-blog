export type PublishMode = "draft" | "published" | "scheduled";
export type PostState = PublishMode;

const pad = (n: number) => String(n).padStart(2, "0");

// <input type="datetime-local"> speaks "YYYY-MM-DDTHH:mm" in the browser's time zone; the API speaks UTC instants
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// A date-time string without an offset is read as local time (ECMAScript Date parsing rules)
export function fromLocalInput(value: string): string | undefined {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime()) ? d.toISOString() : undefined;
}

export function timeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// "Scheduled" is not a status of its own: the backend reports a published post with a future date as scheduled
export function postState(post: {
  status?: "DRAFT" | "PUBLISHED";
  scheduled?: boolean;
}): PostState {
  if (post.status !== "PUBLISHED") {
    return "draft";
  }
  return post.scheduled ? "scheduled" : "published";
}

// The publish date to send. A draft keeps the date it already had, so publishing it again later doesn't lose
// the original date. "Published" keeps a past date; without one (first publish, or a scheduled post published
// early) it sends nothing and the backend uses "now".
export function publishedAtFor(
  mode: PublishMode,
  publishAt: string,
  saved: { publishedAt?: string } | null,
  now: Date,
): string | undefined {
  switch (mode) {
    case "draft":
      return saved?.publishedAt;
    case "published":
      return saved?.publishedAt && new Date(saved.publishedAt) <= now
        ? saved.publishedAt
        : undefined;
    case "scheduled":
      return fromLocalInput(publishAt);
  }
}
