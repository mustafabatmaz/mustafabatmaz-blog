import { describe, expect, it } from "vitest";
import { sitemapEntries } from "./sitemap";

const site = new URL("https://mustafabatmaz.com");

describe("sitemapEntries", () => {
  it("shouldListEveryPage_inBothLanguages_withTheirAlternates", () => {
    const entries = sitemapEntries(site, { pages: {}, posts: [], caseStudies: [] });
    const about = entries.find((entry) => entry.url === "https://mustafabatmaz.com/tr/about");

    expect(entries.map((entry) => entry.url)).toContain("https://mustafabatmaz.com/en/writing");
    expect(about?.alternates?.languages).toEqual({
      tr: "https://mustafabatmaz.com/tr/about",
      en: "https://mustafabatmaz.com/en/about",
    });
  });

  it("shouldDateAboutAndNow_byTheirLastUpdate", () => {
    const entries = sitemapEntries(site, {
      pages: { "/now": "2026-10-30T07:14:33Z" },
      posts: [],
      caseStudies: [],
    });

    expect(
      entries.find((entry) => entry.url === "https://mustafabatmaz.com/en/now")?.lastModified,
    ).toBe("2026-10-30T07:14:33Z");
  });

  it("shouldListEachPostOnce_perLanguage_withItsTranslations", () => {
    const entries = sitemapEntries(site, {
      pages: {},
      posts: [
        {
          updatedAt: "2026-10-31T06:00:00Z",
          translations: [
            { lang: "tr", slug: "kafkada" },
            { lang: "en", slug: "in-kafka" },
          ],
        },
      ],
      caseStudies: ["turkpatent"],
    });
    const urls = entries.map((entry) => entry.url);

    expect(urls.filter((url) => url.includes("/writing/"))).toEqual([
      "https://mustafabatmaz.com/tr/writing/kafkada",
      "https://mustafabatmaz.com/en/writing/in-kafka",
    ]);
    expect(urls).toContain("https://mustafabatmaz.com/en/experience/turkpatent");
  });
});
