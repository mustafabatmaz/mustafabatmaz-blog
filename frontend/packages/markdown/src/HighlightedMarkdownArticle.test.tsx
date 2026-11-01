import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HighlightedMarkdownArticle } from "./HighlightedMarkdownArticle";

// An async Server Component is a function returning a promise of an element; await it, then render
async function render(markdown: string) {
  return renderToStaticMarkup(await HighlightedMarkdownArticle({ markdown }));
}

const java = "```java\npublic enum Status { DRAFT }\n```";

describe("HighlightedMarkdownArticle", () => {
  it("shouldLetTheSiteOfferSmallerVersions_ofItsImages", async () => {
    const images = (src: string) =>
      src === "/media/a.png" ? { srcSet: "/small/a.webp 480w", sizes: "100vw" } : null;
    const html = renderToStaticMarkup(
      await HighlightedMarkdownArticle({
        markdown: "![Diagram](/media/a.png)\n\n![Other](https://example.com/b.png)",
        images,
      }),
    );

    expect(html).toContain('srcSet="/small/a.webp 480w" sizes="100vw"');
    // An image the site can't resize keeps only its own address
    expect(html).toMatch(/<img src="https:\/\/example\.com\/b\.png" alt="Other" loading="lazy"/);
  });

  it("shouldKeepMarkdownImagesPlain_whenNoResizerIsGiven", async () => {
    const html = await render("![Diagram](/media/a.png)");

    expect(html).not.toContain("srcset");
  });

  it("shouldColourCode_withTheIndigoMistTheme", async () => {
    const html = await render(java);

    // "public enum" is a keyword: periwinkle in the theme (PROJECT_DECISION.md §6)
    expect(html).toMatch(/style="color:#a3acf0"/i);
  });

  it("shouldShowCodeAsText_evenWhenItLooksLikeHtml", async () => {
    const html = await render("```html\n<script>alert(1)</script>\n```");

    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;");
  });

  it("shouldPutTheFileNameAndLanguage_aboveTheCode", async () => {
    const html = await render('```java title="ApplicationStatus.java"\nenum A {}\n```');

    expect(html).toMatch(/<figcaption[^>]*>.*ApplicationStatus\.java.*java.*<\/figcaption>/s);
  });

  it("shouldEscapeTheFileName_whenItContainsHtml", async () => {
    const html = await render('```java title="<img src=x onerror=alert(1)>"\nenum A {}\n```');

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("shouldRenderAnUnknownLanguage_asPlainCode", async () => {
    const html = await render("```cobol\nDISPLAY 'HI'.\n```");

    expect(html).toContain("DISPLAY");
  });

  it("shouldDropStylesWrittenInTheMarkdown", async () => {
    const html = await render('<span style="color:red">kırmızı</span> metin');

    expect(html).not.toContain("color:red");
  });

  it("shouldGiveSectionHeadings_readableIds", async () => {
    const html = await render("## Sorunun kaynağı\n\n### Ayrıntı\n\n## Sorunun kaynağı");

    expect(html).toContain('id="sorunun-kaynagi"');
    expect(html).toContain('id="ayrinti"');
    expect(html).toContain('id="sorunun-kaynagi-2"');
  });

  it("shouldKeepTheEarlierSafetyRules", async () => {
    const html = await render('[tıkla](javascript:alert(1)) <img src=x onerror="alert(1)">');

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
  });
});
