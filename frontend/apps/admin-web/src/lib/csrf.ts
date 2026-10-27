import type { Middleware } from "@blog/api-client";

const COOKIE = "XSRF-TOKEN";
const HEADER = "X-XSRF-TOKEN";
const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function readCsrfToken(cookies: string = document.cookie): string | undefined {
  for (const cookie of cookies.split(";")) {
    const [name, ...value] = cookie.trim().split("=");
    if (name === COOKIE) {
      return decodeURIComponent(value.join("="));
    }
  }
  return undefined;
}

// Spring's csrf.spa() puts the token in a cookie JavaScript can read; every write must echo it in a header.
// The cookie is read on each request because the token changes after login.
export const csrfMiddleware: Middleware = {
  onRequest({ request }) {
    if (READ_ONLY_METHODS.has(request.method)) {
      return undefined;
    }
    const token = readCsrfToken();
    if (token) {
      request.headers.set(HEADER, token);
    }
    return request;
  },
};
