import { describe, expect, it } from "vitest";
import { fromMedia, hasAltText, mediaSchema, toMediaRequest } from "./mediaSchema";

describe("hasAltText", () => {
  it("shouldBeTrue_whenAnyLanguageHasText", () => {
    expect(hasAltText({ translations: [{ lang: "en", altText: "Lag chart" }] })).toBe(true);
  });

  it("shouldBeFalse_whenNoLanguageHasText", () => {
    expect(hasAltText({ translations: [] })).toBe(false);
    expect(hasAltText({})).toBe(false);
  });
});

describe("media alt text form", () => {
  it("shouldFillBothLanguages_whenOnlyOneIsSaved", () => {
    expect(fromMedia({ translations: [{ lang: "tr", altText: "Grafik" }] })).toEqual({
      translations: { tr: { altText: "Grafik" }, en: { altText: "" } },
    });
  });

  it("shouldSendOnlyFilledLanguages_withLoadedVersion", () => {
    const values = mediaSchema.parse({
      translations: { tr: { altText: " Grafik " }, en: { altText: "  " } },
    });

    expect(toMediaRequest(values, 3)).toEqual({
      translations: [{ lang: "tr", altText: "Grafik" }],
      version: 3,
    });
  });

  it("shouldSendEmptyList_whenAllAltTextsAreCleared", () => {
    const values = mediaSchema.parse({
      translations: { tr: { altText: "" }, en: { altText: "" } },
    });

    expect(toMediaRequest(values, 0)).toEqual({ translations: [], version: 0 });
  });

  it("shouldReject_whenAltTextIsLongerThan300Characters", () => {
    const result = mediaSchema.safeParse({
      translations: { tr: { altText: "a".repeat(301) }, en: { altText: "" } },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["translations", "tr", "altText"]);
  });
});
