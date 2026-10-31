import { HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { http, server } from "@/test/server";
import {
  getCaseStudy,
  getExperience,
  getLatestPosts,
  getPage,
  getProfile,
  getSocialLinks,
  getUses,
} from "./content";

const notFound = () => HttpResponse.json({ status: 404 }, { status: 404 });
const serverError = () => HttpResponse.json({ status: 500 }, { status: 500 });

const profile = {
  fullName: "Mustafa Batmaz",
  headline: "Senior Software Developer",
  lang: "en" as const,
  socialLinks: [{ platform: "GITHUB" as const, url: "https://github.com/mustafabatmaz" }],
  education: [],
};

describe("content", () => {
  it("shouldAskForTheRequestedLanguage", async () => {
    let lang: string | null = null;
    server.use(
      http.get("/api/public/profile", ({ request, response }) => {
        lang = new URL(request.url).searchParams.get("lang");
        return response(200).json(profile);
      }),
    );

    await getProfile("en");

    expect(lang).toBe("en");
  });

  it("shouldReturnNull_whenAPageWasNeverSaved", async () => {
    server.use(http.get("/api/public/pages/{key}", ({ response }) => response.untyped(notFound())));

    await expect(getPage("NOW", "tr")).resolves.toBeNull();
  });

  it("shouldReturnNull_whenAProjectHasNoCaseStudy", async () => {
    server.use(
      http.get("/api/public/experience/projects/{slug}", ({ response }) =>
        response.untyped(notFound()),
      ),
    );

    await expect(getCaseStudy("bilinmeyen", "tr")).resolves.toBeNull();
  });

  it("shouldReturnTheLists_asTheApiSendsThem", async () => {
    server.use(
      http.get("/api/public/uses", ({ response }) => response(200).json([])),
      http.get("/api/public/experience", ({ response }) => response(200).json([])),
    );

    await expect(getUses("tr")).resolves.toEqual([]);
    await expect(getExperience("tr")).resolves.toEqual([]);
  });

  it("shouldReturnTheFirstThreePosts_ofTheFirstPage", async () => {
    const post = (slug: string) => ({
      slug,
      title: slug,
      publishedAt: "2026-10-01T09:00:00Z",
      readingMinutes: 4,
      tags: [],
      lang: "tr" as const,
    });
    let page: string | null = null;
    server.use(
      http.get("/api/public/posts", ({ request, response }) => {
        page = new URL(request.url).searchParams.get("page");
        return response(200).json({
          items: ["a", "b", "c", "d"].map(post),
          page: 1,
          size: 10,
          totalItems: 4,
          totalPages: 1,
        });
      }),
    );

    const posts = await getLatestPosts("tr");

    expect(page).toBe("1");
    expect(posts.map((p) => p.slug)).toEqual(["a", "b", "c"]);
  });

  it("shouldGiveTheFooterTheLinks_whenTheProfileLoads", async () => {
    server.use(http.get("/api/public/profile", ({ response }) => response(200).json(profile)));

    await expect(getSocialLinks("tr")).resolves.toEqual(profile.socialLinks);
  });

  it("shouldGiveTheFooterNoLinks_insteadOfFailing", async () => {
    server.use(http.get("/api/public/profile", ({ response }) => response.untyped(serverError())));

    await expect(getSocialLinks("tr")).resolves.toEqual([]);
  });

  it("shouldGiveTheFooterNoLinks_whenThereIsNoProfile", async () => {
    server.use(http.get("/api/public/profile", ({ response }) => response.untyped(notFound())));

    await expect(getSocialLinks("tr")).resolves.toEqual([]);
  });
});
