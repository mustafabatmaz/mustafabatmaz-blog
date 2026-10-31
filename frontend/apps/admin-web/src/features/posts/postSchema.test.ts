import type { Schemas } from "@blog/api-client";
import { describe, expect, it } from "vitest";
import { createPostSchema, fromPost, postTitle, toPostRequest } from "./postSchema";

const now = new Date(2026, 9, 30, 12, 0);
const schema = createPostSchema(() => now);

const saved: Schemas["PostAdminResponse"] = {
  id: 7,
  status: "PUBLISHED",
  publishedAt: new Date(2026, 9, 14, 9, 12).toISOString(),
  scheduled: false,
  coverMediaId: 3,
  translations: [
    {
      lang: "tr",
      slug: "kaybolan-eventler",
      title: "Kaybolan event'ler",
      summary: "",
      bodyMd: "## Giriş",
      readingMinutes: 6,
    },
  ],
  tags: ["Kafka"],
  version: 4,
  createdAt: new Date(2026, 9, 14, 9, 0).toISOString(),
  updatedAt: new Date(2026, 9, 14, 9, 12).toISOString(),
};

function issues(value: unknown) {
  const result = schema.safeParse(value);
  return result.success ? [] : result.error.issues.map((i) => [i.path.join("."), i.message]);
}

describe("post form", () => {
  it("shouldStartAsEmptyDraft_whenPostIsNew", () => {
    expect(fromPost(null)).toMatchObject({
      mode: "draft",
      publishAt: "",
      coverMediaId: null,
      tags: [],
      translations: { tr: { title: "", slug: "", summary: "", bodyMd: "" } },
    });
  });

  it("shouldFillFormFromSavedPost", () => {
    expect(fromPost(saved)).toMatchObject({
      mode: "published",
      coverMediaId: 3,
      tags: ["Kafka"],
      translations: { tr: { slug: "kaybolan-eventler" }, en: { title: "" } },
    });
  });

  it("shouldBuildRequest_withFilledLanguagesKeptDateAndVersion", () => {
    const values = schema.parse(fromPost(saved));

    expect(toPostRequest(values, saved, now)).toEqual({
      status: "PUBLISHED",
      publishedAt: saved.publishedAt,
      coverMediaId: 3,
      translations: [
        {
          lang: "tr",
          slug: "kaybolan-eventler",
          title: "Kaybolan event'ler",
          bodyMd: "## Giriş",
        },
      ],
      tags: ["Kafka"],
      version: 4,
    });
  });

  it("shouldLeaveOutCover_whenItWasRemoved", () => {
    const values = schema.parse({ ...fromPost(saved), coverMediaId: null });

    expect(toPostRequest(values, saved, now)).not.toHaveProperty("coverMediaId");
  });

  it("shouldRequireTitleSlugAndBody_inAFilledLanguage", () => {
    const form = fromPost(null);
    form.translations.en.summary = "Only a summary";

    expect(issues(form)).toEqual([
      ["translations.en.title", "Bu alan gerekli."],
      ["translations.en.slug", "Bu alan gerekli."],
      ["translations.en.bodyMd", "Bu alan gerekli."],
    ]);
  });

  it("shouldRejectSlug_thatIsNotUrlFriendly", () => {
    const form = fromPost(saved);
    form.translations.tr.slug = "Kaybolan Eventler";

    expect(issues(form)).toEqual([
      ["translations.tr.slug", expect.stringContaining("küçük harf") as string],
    ]);
  });

  it("shouldRejectSlugs_thatThePublicSiteUsesForItsListPages", () => {
    const form = fromPost(saved);
    form.translations.tr.slug = "page";

    expect(issues(form)).toEqual([
      ["translations.tr.slug", expect.stringContaining("ayrılmış") as string],
    ]);
  });

  it("shouldRequireFutureMoment_whenScheduling", () => {
    const form = { ...fromPost(saved), mode: "scheduled" as const };

    expect(issues({ ...form, publishAt: "" })).toEqual([
      ["publishAt", "Yayın tarihini ve saatini seç."],
    ]);
    expect(issues({ ...form, publishAt: "2026-10-29T09:00" })).toEqual([
      ["publishAt", "İleri bir tarih seç; geçmiş bir tarih için Yayında seçeneğini kullan."],
    ]);
    expect(issues({ ...form, publishAt: "2026-11-06T09:00" })).toEqual([]);
  });

  it("shouldAllowAtMostTenTags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `Etiket ${String(i)}`);

    expect(issues({ ...fromPost(saved), tags })).toEqual([
      ["tags", "En fazla 10 etiket olabilir."],
    ]);
  });
});

describe("postTitle", () => {
  it("shouldPreferTurkishTitle_andFallBackToEnglish", () => {
    const both: Schemas["TranslationTitle"][] = [
      { lang: "en", slug: "a", title: "English" },
      { lang: "tr", slug: "b", title: "Türkçe" },
    ];

    expect(postTitle(both)).toBe("Türkçe");
    expect(postTitle(both.slice(0, 1))).toBe("English");
  });
});
