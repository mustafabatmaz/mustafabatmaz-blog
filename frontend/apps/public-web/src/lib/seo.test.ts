import { describe, expect, it } from "vitest";
import { pageAlternates, postAlternates } from "./seo";

describe("pageAlternates", () => {
  it("shouldPointToItselfAndToBothLanguages", () => {
    expect(pageAlternates("/about", "en")).toEqual({
      canonical: "/en/about",
      languages: { tr: "/tr/about", en: "/en/about", "x-default": "/tr/about" },
      types: { "application/rss+xml": "/en/rss.xml" },
    });
  });

  it("shouldUseTheLanguageRoot_forTheHomePage", () => {
    expect(pageAlternates("/", "tr").canonical).toBe("/tr");
  });
});

describe("postAlternates", () => {
  it("shouldListOnlyTheTranslationsThatExist_eachWithItsOwnSlug", () => {
    expect(
      postAlternates("tr", "kafkada-kaybolan-eventler", [
        { lang: "tr", slug: "kafkada-kaybolan-eventler" },
        { lang: "en", slug: "disappearing-kafka-events" },
      ]),
    ).toEqual({
      canonical: "/tr/writing/kafkada-kaybolan-eventler",
      languages: {
        tr: "/tr/writing/kafkada-kaybolan-eventler",
        en: "/en/writing/disappearing-kafka-events",
        "x-default": "/tr/writing/kafkada-kaybolan-eventler",
      },
      types: { "application/rss+xml": "/tr/rss.xml" },
    });
  });

  it("shouldLeaveOutXDefault_whenThereIsNoTurkishVersion", () => {
    const alternates = postAlternates("en", "only-english", [{ lang: "en", slug: "only-english" }]);

    expect(alternates.languages).toEqual({ en: "/en/writing/only-english" });
  });
});
