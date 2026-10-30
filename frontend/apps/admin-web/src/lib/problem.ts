// The backend answers every error with an RFC 9457 problem detail. The spec doesn't describe error
// responses, so the fields we use are read defensively here.
interface ProblemDetail {
  type?: string | undefined;
  title?: string | undefined;
  detail?: string | undefined;
}

// Problem types the UI reacts to differently (backend: common.ProblemTypes). The RFC says to tell
// problems apart by "type", never by parsing "detail".
export const PROBLEM_TYPES = {
  versionConflict: "https://mustafabatmaz.com/problems/version-conflict",
  slugTaken: "https://mustafabatmaz.com/problems/slug-taken",
  mediaInUse: "https://mustafabatmaz.com/problems/media-in-use",
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly type: string | undefined;
  readonly title: string | undefined;
  readonly detail: string | undefined;

  constructor(status: number, problem?: ProblemDetail) {
    super(problem?.detail ?? `Request failed with status ${String(status)}`);
    this.name = "ApiError";
    this.status = status;
    this.type = problem?.type;
    this.title = problem?.title;
    this.detail = problem?.detail;
  }
}

export function toProblem(body: unknown): ProblemDetail | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const { type, title, detail } = body as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value : undefined);
  return { type: text(type), title: text(title), detail: text(detail) };
}

export function isProblem(error: unknown, type: string): error is ApiError {
  return error instanceof ApiError && error.type === type;
}
