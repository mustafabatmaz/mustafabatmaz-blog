import { HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { http, server } from "@/test/server";
import { api, unwrap } from "./api";
import { ApiError } from "./problem";

describe("api", () => {
  it("shouldSendCsrfTokenFromCookie_whenRequestChangesData", async () => {
    document.cookie = "XSRF-TOKEN=token-1";
    let sent: string | null = null;
    server.use(
      http.post("/api/admin/auth/logout", ({ request, response }) => {
        sent = request.headers.get("X-XSRF-TOKEN");
        return response(204).empty();
      }),
    );

    await unwrap(api.POST("/api/admin/auth/logout"));

    expect(sent).toBe("token-1");
  });

  it("shouldNotSendCsrfToken_whenRequestOnlyReads", async () => {
    document.cookie = "XSRF-TOKEN=token-1";
    let sent: string | null = "not checked";
    server.use(
      http.get("/api/admin/auth/me", ({ request, response }) => {
        sent = request.headers.get("X-XSRF-TOKEN");
        return response(200).json({ username: "mustafa" });
      }),
    );

    await unwrap(api.GET("/api/admin/auth/me"));

    expect(sent).toBeNull();
  });

  it("shouldSendLatestToken_whenCookieChangesBetweenRequests", async () => {
    const sent: (string | null)[] = [];
    server.use(
      http.post("/api/admin/auth/logout", ({ request, response }) => {
        sent.push(request.headers.get("X-XSRF-TOKEN"));
        return response(204).empty();
      }),
    );

    document.cookie = "XSRF-TOKEN=before-login";
    await unwrap(api.POST("/api/admin/auth/logout"));
    document.cookie = "XSRF-TOKEN=after-login";
    await unwrap(api.POST("/api/admin/auth/logout"));

    expect(sent).toEqual(["before-login", "after-login"]);
  });

  it("shouldReturnResponseBody_whenRequestSucceeds", async () => {
    server.use(
      http.get("/api/admin/auth/me", ({ response }) => response(200).json({ username: "mustafa" })),
    );

    const me = await unwrap(api.GET("/api/admin/auth/me"));

    expect(me).toEqual({ username: "mustafa" });
  });

  it("shouldThrowApiErrorWithProblemDetail_whenServerRejectsRequest", async () => {
    server.use(
      http.get("/api/admin/auth/me", ({ response }) =>
        response.untyped(
          HttpResponse.json(
            {
              type: "about:blank",
              title: "Conflict",
              status: 409,
              detail: "The change conflicts with existing data",
            },
            { status: 409, headers: { "Content-Type": "application/problem+json" } },
          ),
        ),
      ),
    );

    const error = await unwrap(api.GET("/api/admin/auth/me")).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      title: "Conflict",
      detail: "The change conflicts with existing data",
    });
  });

  it("shouldThrowApiErrorWithStatusOnly_whenErrorBodyIsNotProblemDetail", async () => {
    server.use(
      http.get("/api/admin/auth/me", ({ response }) =>
        response.untyped(new HttpResponse("Bad Gateway", { status: 502 })),
      ),
    );

    const error = await unwrap(api.GET("/api/admin/auth/me")).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, detail: undefined });
  });
});
