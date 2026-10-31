import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownArticle } from "./MarkdownArticle";

function render(markdown: string) {
  return renderToStaticMarkup(<MarkdownArticle markdown={markdown} />);
}

describe("MarkdownArticle", () => {
  it("shouldRenderATopLevelHeading_asASectionHeading_soThePageKeepsOneH1", () => {
    const html = render("# Giriş\n\n## Ayrıntı");

    expect(html).not.toContain("<h1");
    expect(html).toMatch(/<h2[^>]*>Giriş<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>Ayrıntı<\/h2>/);
  });

  it("shouldKeepTheImageSourceAndAltText", () => {
    const html = render("![Mimari şema](/api/public/media/abc.webp)");

    expect(html).toContain('src="/api/public/media/abc.webp"');
    expect(html).toContain('alt="Mimari şema"');
  });

  it("shouldStillDropRawHtml_withTheArticleStyles", () => {
    const html = render('Merhaba <script>alert("xss")</script>');

    expect(html).not.toContain("<script");
  });
});
