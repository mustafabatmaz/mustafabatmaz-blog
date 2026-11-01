// Our uploads, resized by Next's image optimizer (6b decision 1). The widths are the only ones next.config lets
// the optimizer produce; the browser picks one from srcset using sizes, which follows the article column
// (700px wide, 24px page padding each side on narrow screens).
export const imageWidths = [480, 720, 1080, 1440];

const quality = 75;
const sizes = "(min-width: 748px) 700px, calc(100vw - 48px)";

// Same rule as next.config's localPatterns: our media path, no query string. Anything else would get a 400
// from the optimizer, so it keeps its plain src.
const ownMedia = /^\/api\/public\/media\/[^/?#]+$/;

export function responsiveImage(src: string | undefined): { srcSet: string; sizes: string } | null {
  if (!src || !ownMedia.test(src)) {
    return null;
  }
  const url = encodeURIComponent(src);
  const srcSet = imageWidths
    .map(
      (width) =>
        `/_next/image?url=${url}&w=${String(width)}&q=${String(quality)} ${String(width)}w`,
    )
    .join(", ");
  return { srcSet, sizes };
}
