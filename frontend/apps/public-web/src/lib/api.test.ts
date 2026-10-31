import { HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { http, server } from "@/test/server";
import { api, ApiError, dataOrNull } from "./api";

const profile = {
  fullName: "Mustafa Batmaz",
  headline: "Senior Software Developer",
  lang: "en" as const,
  socialLinks: [],
};

describe("dataOrNull", () => {
  it("shouldReturnTheBody_whenTheApiAnswers", async () => {
    server.use(http.get("/api/public/profile", ({ response }) => response(200).json(profile)));

    await expect(dataOrNull(api.GET("/api/public/profile"))).resolves.toEqual(profile);
  });

  it("shouldReturnNull_whenTheApiSaysNotFound", async () => {
    server.use(
      http.get("/api/public/profile", ({ response }) =>
        response.untyped(HttpResponse.json({ status: 404 }, { status: 404 })),
      ),
    );

    await expect(dataOrNull(api.GET("/api/public/profile"))).resolves.toBeNull();
  });

  it("shouldThrow_whenTheApiFails", async () => {
    server.use(
      http.get("/api/public/profile", ({ response }) =>
        response.untyped(HttpResponse.json({ status: 500, detail: "Boom" }, { status: 500 })),
      ),
    );

    const failure = dataOrNull(api.GET("/api/public/profile"));

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: 500 });
  });
});
