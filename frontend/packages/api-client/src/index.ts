import createClient, { type ClientOptions } from "openapi-fetch";
import type { components, paths } from "./schema";

export type { components, paths };
export type { Middleware } from "openapi-fetch";
export type Schemas = components["schemas"];

export function createApiClient(options?: ClientOptions) {
  return createClient<paths>(options);
}

export type ApiClient = ReturnType<typeof createApiClient>;
