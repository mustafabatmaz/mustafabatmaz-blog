import { describe, expect, it } from "vitest";
import { isSlug, slugify } from "./slug";

// Same examples as the backend's SlugsTest, so the two rules can't drift apart
describe("slugify", () => {
  it("shouldTransliterateTurkishLetters", () => {
    expect(slugify("Güvenlik")).toBe("guvenlik");
    expect(slugify("Ölçeklenebilirlik")).toBe("olceklenebilirlik");
    expect(slugify("İŞ AKIŞI")).toBe("is-akisi");
    expect(slugify("ğıüşöç ĞIÜŞÖÇ")).toBe("giusoc-giusoc");
  });

  it("shouldJoinWordsWithSingleDashes", () => {
    expect(slugify("  Spring   Boot 4 ")).toBe("spring-boot-4");
    expect(slugify("C++ & Java/Kotlin")).toBe("c-java-kotlin");
  });

  it("shouldDropOtherAccents", () => {
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });

  it("shouldReturnEmpty_whenTextHasNothingUsable", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("isSlug", () => {
  it("shouldAcceptLowercaseWordsJoinedByDashes", () => {
    expect(isSlug("patent-basvuru-sistemi")).toBe(true);
  });

  it("shouldReject_whenSlugHasCapitalsSpacesOrEdgeDashes", () => {
    expect(isSlug("Patent")).toBe(false);
    expect(isSlug("patent sistemi")).toBe(false);
    expect(isSlug("-patent")).toBe(false);
    expect(isSlug("patent--sistemi")).toBe(false);
  });
});
