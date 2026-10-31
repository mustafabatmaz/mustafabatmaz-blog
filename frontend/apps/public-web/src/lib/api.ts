import { createApiClient } from "@blog/api-client";

// Server-side only: the backend is reached over the compose network (http://backend:8080), never from the
// browser. Pages are cached as a whole (revalidate), so requests need no cache options of their own.
export const api = createApiClient({
  baseUrl: process.env.API_BASE_URL ?? "http://localhost:8080",
  // openapi-fetch keeps the fetch it is given; looking it up per request lets tests' MSW see the calls
  fetch: (request) => globalThis.fetch(request),
});

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Public API answered ${String(status)}`);
    this.name = "ApiError";
    this.status = status;
  }
}

// A 404 is an answer ("nothing here", the page shows notFound); anything else that isn't data is a failure
// for error.tsx, and the cached page from before keeps being served meanwhile.
export async function dataOrNull<T>(
  request: Promise<{ data?: T; response: Response }>,
): Promise<T | null> {
  const { data, response } = await request;
  if (response.status === 404) {
    return null;
  }
  if (!response.ok || data === undefined) {
    throw new ApiError(response.status);
  }
  return data;
}
