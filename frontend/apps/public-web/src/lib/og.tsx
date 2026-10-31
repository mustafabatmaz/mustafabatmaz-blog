import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteUrl } from "./site";

// The share images (public canvas, "Faz 5d" boards): a page card and a post card, 1200×630, light Indigo Mist.
// next/og draws with inline styles and hex values: it renders outside the page, without Tailwind or the CSS
// variables, so the colours below mirror the tokens in @blog/tokens (PROJECT_DECISION.md §6).
const colors = {
  background: "#F6F6FA",
  foreground: "#191B33",
  muted: "#5A5E7A",
  link: "#4C56B8",
  mint: "#D6EEEB",
  mintForeground: "#22625D",
  monogram: "#E1E4F8",
};

export const ogSize = { width: 1200, height: 630 };

// next/og reads ttf, otf and woff, not woff2; @fontsource ships woff. latin-ext carries ğ, ş, ı and İ: the
// renderer falls back to the next font with the same name for glyphs the first one lacks (5d decision 2).
// Read from the project folder as the Next docs do (a require.resolve of a .woff confuses Turbopack); the
// Docker image has to include these files (5e).
const font = (file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", file));
const [groteskBold, groteskBoldExt, groteskMedium, groteskMediumExt, mono, monoExt] =
  await Promise.all(
    [
      "space-grotesk/files/space-grotesk-latin-700-normal.woff",
      "space-grotesk/files/space-grotesk-latin-ext-700-normal.woff",
      "space-grotesk/files/space-grotesk-latin-500-normal.woff",
      "space-grotesk/files/space-grotesk-latin-ext-500-normal.woff",
      "space-mono/files/space-mono-latin-400-normal.woff",
      "space-mono/files/space-mono-latin-ext-400-normal.woff",
    ].map(font),
  );

export const ogFonts = [
  { name: "Space Grotesk", data: groteskBold, weight: 700 as const },
  { name: "Space Grotesk", data: groteskBoldExt, weight: 700 as const },
  { name: "Space Grotesk", data: groteskMedium, weight: 500 as const },
  { name: "Space Grotesk", data: groteskMediumExt, weight: 500 as const },
  { name: "Space Mono", data: mono, weight: 400 as const },
  { name: "Space Mono", data: monoExt, weight: 400 as const },
];

function Monogram({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: colors.monogram,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "-0.05em",
      }}
    >
      <span
        style={{
          fontFamily: "Space Grotesk",
          fontWeight: 700,
          fontSize: size * 0.42,
          color: colors.foreground,
        }}
      >
        m
      </span>
      <span style={{ fontFamily: "Space Mono", fontSize: size * 0.28, color: colors.link }}>
        /b
      </span>
    </div>
  );
}

function Card({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "64px 72px",
        background: colors.background,
        color: colors.foreground,
        fontFamily: "Space Grotesk",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Monogram size={72} />
          <span style={{ fontSize: 28, fontWeight: 500 }}>{name}</span>
        </div>
        <span style={{ fontFamily: "Space Mono", fontSize: 22, color: colors.link }}>
          {siteUrl().host}
        </span>
      </div>
    </div>
  );
}

export function pageCard({
  name,
  label,
  title,
  subtitle,
}: {
  name: string;
  label: string;
  title: string;
  subtitle?: string | null | undefined;
}) {
  return new ImageResponse(
    <Card name={name}>
      <span style={{ fontFamily: "Space Mono", fontSize: 24, color: colors.link }}>{label}</span>
      <div
        style={{
          display: "flex",
          fontSize: 96,
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: "-0.05em",
        }}
      >
        {title}
        <span style={{ color: colors.link }}>.</span>
      </div>
      {subtitle && (
        <div style={{ fontSize: 32, lineHeight: 1.4, color: colors.muted, maxWidth: 950 }}>
          {subtitle}
        </div>
      )}
    </Card>,
    { ...ogSize, fonts: ogFonts },
  );
}

export function postCard({
  name,
  title,
  tags,
  meta,
}: {
  name: string;
  title: string;
  tags: readonly string[];
  meta: string;
}) {
  return new ImageResponse(
    <Card name={name}>
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: 22,
                background: colors.mint,
                color: colors.mintForeground,
                fontFamily: "Space Mono",
                fontSize: 22,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div style={{ fontSize: 68, lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.04em" }}>
        {title}
      </div>
      <span style={{ fontFamily: "Space Mono", fontSize: 24, color: colors.muted }}>{meta}</span>
    </Card>,
    { ...ogSize, fonts: ogFonts },
  );
}

// The favicon and the Apple touch icon: just the bold m (§6: three characters don't read at 20px). The favicon
// is a circle like the monogram; the Apple icon fills its square, since iOS rounds the corners itself.
export function iconImage(size: number, shape: "circle" | "square") {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: shape === "circle" ? size / 2 : 0,
        background: colors.monogram,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Space Grotesk",
        fontWeight: 700,
        fontSize: size * 0.68,
        color: colors.foreground,
        paddingBottom: size * 0.08,
      }}
    >
      m
    </div>,
    { width: size, height: size, fonts: ogFonts },
  );
}
