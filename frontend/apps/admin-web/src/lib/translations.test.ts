import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fromTranslations, toTranslations, translationsSchema } from "./translations";

const empty = { headline: "", intro: "" };

describe("toTranslations", () => {
  it("shouldLeaveOutLanguage_whenAllItsFieldsAreBlank", () => {
    const result = toTranslations({
      tr: { headline: "Geliştirici", intro: "" },
      en: { headline: "  ", intro: "" },
    });

    expect(result).toEqual([{ lang: "tr", headline: "Geliştirici" }]);
  });

  it("shouldDropBlankOptionalFields_whenLanguageIsFilled", () => {
    const result = toTranslations({
      tr: { headline: "Geliştirici", intro: "   " },
      en: { headline: "Developer", intro: "Hello" },
    });

    expect(result).toEqual([
      { lang: "tr", headline: "Geliştirici" },
      { lang: "en", headline: "Developer", intro: "Hello" },
    ]);
  });
});

describe("fromTranslations", () => {
  it("shouldFillMissingLanguageWithEmptyValues_whenOnlyOneExists", () => {
    const result = fromTranslations([{ lang: "tr", headline: "Geliştirici" }], empty);

    expect(result).toEqual({
      tr: { headline: "Geliştirici", intro: "" },
      en: { headline: "", intro: "" },
    });
  });

  it("shouldStartEmpty_whenNothingWasSavedYet", () => {
    expect(fromTranslations(undefined, empty)).toEqual({ tr: empty, en: empty });
  });
});

describe("translationsSchema", () => {
  const schema = translationsSchema({ headline: z.string(), intro: z.string() }, ["headline"]);

  function issues(value: unknown) {
    const result = schema.safeParse(value);
    return result.success ? [] : result.error.issues.map((i) => [i.path.join("."), i.message]);
  }

  it("shouldRequireAtLeastOneLanguage_whenBothAreBlank", () => {
    expect(issues({ tr: empty, en: empty })).toEqual([
      ["tr.headline", "En az bir dilde içerik gir."],
    ]);
  });

  it("shouldRequireMandatoryField_whenLanguageIsPartlyFilled", () => {
    expect(
      issues({ tr: { headline: "Geliştirici", intro: "" }, en: { headline: "", intro: "Hi" } }),
    ).toEqual([["en.headline", "Bu alan gerekli."]]);
  });

  it("shouldAcceptOneLanguage_whenTheOtherIsBlank", () => {
    expect(issues({ tr: { headline: "Geliştirici", intro: "" }, en: empty })).toEqual([]);
  });
});
