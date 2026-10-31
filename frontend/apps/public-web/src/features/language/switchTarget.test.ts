import { describe, expect, it } from "vitest";
import { switchTarget } from "./switchTarget";

describe("switchTarget", () => {
  it("shouldKeepThePath_whenItIsTheSameInBothLanguages", () => {
    expect(switchTarget("/about")).toBe("/about");
    expect(switchTarget("/writing/page/2")).toBe("/writing/page/2");
    expect(switchTarget("/writing/tags/kafka")).toBe("/writing/tags/kafka");
    expect(switchTarget("/experience/turkpatent")).toBe("/experience/turkpatent");
  });

  it("shouldGoToTheWritingList_fromAPost_becauseSlugsDifferPerLanguage", () => {
    expect(switchTarget("/writing/kafkada-kaybolan-eventler")).toBe("/writing");
  });
});
