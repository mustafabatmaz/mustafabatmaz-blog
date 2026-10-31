import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { extractHeadings } from "./headings";
import { MarkdownArticle } from "./MarkdownArticle";

const markdown = "# Giriş\n\n## Belirti: hiçbir şey olmuyor\n\n### Ayrıntı\n\n## Çözüm\n\n## Çözüm";

describe("extractHeadings", () => {
  it("shouldListTheSectionHeadings_withTheirText", () => {
    expect(extractHeadings(markdown).map((h) => h.text)).toEqual([
      "Belirti: hiçbir şey olmuyor",
      "Çözüm",
      "Çözüm",
    ]);
  });

  it("shouldLinkToIdsThatExistOnThePage", () => {
    const html = renderToStaticMarkup(<MarkdownArticle markdown={markdown} />);

    for (const heading of extractHeadings(markdown)) {
      expect(html).toContain(`id="${heading.id}"`);
    }
    expect(extractHeadings(markdown).map((h) => h.id)).toEqual([
      "belirti-hicbir-sey-olmuyor",
      "cozum",
      "cozum-2",
    ]);
  });
});
