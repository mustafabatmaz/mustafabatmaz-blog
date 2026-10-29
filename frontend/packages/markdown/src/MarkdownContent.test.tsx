import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./MarkdownContent";

function render(markdown: string) {
  return renderToStaticMarkup(<MarkdownContent>{markdown}</MarkdownContent>);
}

describe("MarkdownContent", () => {
  it("shouldRenderGfmTable_whenMarkdownHasTable", () => {
    const html = render("| Dil | Durum |\n| --- | --- |\n| TR | var |");

    expect(html).toContain("<table>");
    expect(html).toContain("<td>TR</td>");
  });

  it("shouldNotRenderRawHtml_whenMarkdownContainsScript", () => {
    const html = render('Merhaba <script>alert("xss")</script> <img src=x onerror="alert(1)">');

    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
  });

  it("shouldDropUnsafeLink_whenLinkUsesJavascriptProtocol", () => {
    const html = render("[tıkla](javascript:alert(1))");

    expect(html).not.toContain("javascript:");
  });

  it("shouldKeepLink_whenLinkIsHttps", () => {
    const html = render("[GitHub](https://github.com/mustafabatmaz)");

    expect(html).toContain('href="https://github.com/mustafabatmaz"');
  });
});
