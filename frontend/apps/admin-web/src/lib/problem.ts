// The backend answers every error with an RFC 9457 problem detail. The spec doesn't describe error
// responses, so the two fields we use are read defensively here.
interface ProblemDetail {
  title?: string;
  detail?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string | undefined;
  readonly detail: string | undefined;

  constructor(status: number, problem?: ProblemDetail) {
    super(problem?.detail ?? `Request failed with status ${String(status)}`);
    this.name = "ApiError";
    this.status = status;
    this.title = problem?.title;
    this.detail = problem?.detail;
  }
}

export function toProblem(body: unknown): ProblemDetail | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const { title, detail } = body as Record<string, unknown>;
  return {
    title: typeof title === "string" ? title : undefined,
    detail: typeof detail === "string" ? detail : undefined,
  };
}
