// Which "##" heading the reader is in: the last one whose top has scrolled up to the offset line (just under
// the top of the screen), or the first one before any has. tops come from getBoundingClientRect.
export function activeHeading(
  headings: readonly { id: string; top: number }[],
  offset: number,
): string | null {
  let active = headings[0]?.id ?? null;
  for (const heading of headings) {
    if (heading.top <= offset) {
      active = heading.id;
    }
  }
  return active;
}
