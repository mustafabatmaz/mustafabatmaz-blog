import { createApiClient } from "@blog/api-client";
import { csrfMiddleware } from "./csrf";
import { ApiError, toProblem } from "./problem";

// The API is always same-origin (Vite proxy in dev, nginx later). An absolute base URL also works in jsdom.
// fetch is looked up per request: openapi-fetch would otherwise keep the fetch that existed at import time,
// before MSW patches it in tests.
export const api = createApiClient({
  baseUrl: window.location.origin,
  fetch: (request) => globalThis.fetch(request),
});
api.use(csrfMiddleware);

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

// openapi-fetch returns errors as values; TanStack Query expects a rejected promise
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await request;
  if (!response.ok) {
    throw new ApiError(response.status, toProblem(error));
  }
  return data as T;
}
