// Mirrors the backend's Slugs.slugify; both are tested with the same examples.
// Turkish letters are mapped first: "İ".toLowerCase() is "i" plus a combining dot, and "ı" has no accent
// to strip, so Unicode normalisation alone would get both wrong.
const turkish: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Empty when the text has no letters or digits to build a URL from
export function slugify(text: string) {
  return Array.from(text, (char) => turkish[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // accents left after decomposition (é → e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export function isSlug(value: string) {
  return pattern.test(value);
}
