import { describe, expect, it } from "vitest";
import { nowSummary } from "./nowSummary";

describe("nowSummary", () => {
  it("shouldTakeTheFirstParagraph_asPlainText", () => {
    const markdown =
      "TÜRKPATENT için **Java 21** ve [Spring Boot](https://spring.io) kullanıyorum.\n\nİkinci paragraf.";

    expect(nowSummary(markdown)).toBe("TÜRKPATENT için Java 21 ve Spring Boot kullanıyorum.");
  });

  it("shouldSkipHeadingsAndLists_beforeTheFirstParagraph", () => {
    const markdown = "## Bu ay\n\n- madde\n- madde\n\nAsıl paragraf `kod` ile.";

    expect(nowSummary(markdown)).toBe("Asıl paragraf kod ile.");
  });

  it("shouldBeNull_whenThereIsNoParagraph", () => {
    expect(nowSummary("")).toBeNull();
    expect(nowSummary("## Sadece başlık")).toBeNull();
  });
});
