import { HttpResponse } from "msw/http";
import { http } from "./server";

// RFC 9457 error body, the way the backend sends it. Error responses aren't in the spec, so handlers wrap
// this in response.untyped(...).
export function problem(status: number, detail: string, type = "about:blank") {
  return HttpResponse.json(
    { type, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export function signedIn() {
  return http.get("/api/admin/auth/me", ({ response }) =>
    response(200).json({ username: "mustafa" }),
  );
}

export function signedOut() {
  return http.get("/api/admin/auth/me", ({ response }) =>
    response.untyped(problem(401, "Authentication required")),
  );
}
