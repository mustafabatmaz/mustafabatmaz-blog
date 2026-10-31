import type { paths } from "@blog/api-client";
import { setupServer } from "msw/node";
import { createOpenApiHttp } from "openapi-msw";

export const API_BASE_URL = "http://backend.test";

// Fake backend for tests. Handlers are typed against the spec, so a stale mock fails typecheck.
export const server = setupServer();
export const http = createOpenApiHttp<paths>({ baseUrl: API_BASE_URL });
