import { describe, expect, it } from "vitest";
import { buildRss } from "./rss";

const site = new URL("https://mustafabatmaz.com");

describe("buildRss", () => {
  it("shouldDescribeTheFeedAndEachPost", () => {
    const xml = buildRss({
      site,
      locale: "tr",
      title: "Mustafa Batmaz · Yazılar",
      description: "Az ama öz yazılar.",
      posts: [
        {
          slug: "kafkada-kaybolan-eventler",
          title: "Kafka'da kaybolan event'ler",
          summary: "Hata fırlatmayan bir hata.",
          publishedAt: "2026-10-14T09:12:00Z",
          tags: [{ name: "Kafka" }],
        },
      ],
    });

    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain("<language>tr</language>");
    expect(xml).toContain(
      '<atom:link href="https://mustafabatmaz.com/tr/rss.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(xml).toContain(
      "<link>https://mustafabatmaz.com/tr/writing/kafkada-kaybolan-eventler</link>",
    );
    expect(xml).toContain(
      '<guid isPermaLink="true">https://mustafabatmaz.com/tr/writing/kafkada-kaybolan-eventler</guid>',
    );
    expect(xml).toContain("<pubDate>Wed, 14 Oct 2026 09:12:00 GMT</pubDate>");
    expect(xml).toContain("<category>Kafka</category>");
  });

  it("shouldEscapeTextThatLooksLikeXml", () => {
    const xml = buildRss({
      site,
      locale: "en",
      title: "Writing",
      description: "Posts",
      posts: [
        {
          slug: "a",
          title: 'Generics <T> & "you"',
          summary: "<script>alert(1)</script>",
          publishedAt: "2026-10-14T09:12:00Z",
          tags: [],
        },
      ],
    });

    expect(xml).toContain("<title>Generics &lt;T&gt; &amp; &quot;you&quot;</title>");
    expect(xml).not.toContain("<script>");
  });

  it("shouldLeaveOutTheDescription_whenAPostHasNoSummary", () => {
    const xml = buildRss({
      site,
      locale: "en",
      title: "Writing",
      description: "Posts",
      posts: [{ slug: "a", title: "A", publishedAt: "2026-10-14T09:12:00Z", tags: [] }],
    });

    expect(xml.match(/<description>/g)).toHaveLength(1);
  });
});
