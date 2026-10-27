import type { paths } from "@blog/api-client";
import { setupServer } from "msw/node";
import { createOpenApiHttp } from "openapi-msw";

// Fake backend for tests. Handlers are typed against the spec, so a stale mock fails typecheck.
export const server = setupServer();
export const http = createOpenApiHttp<paths>();
