const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// For name lists the backend finds or creates by name, ignoring case (technologies, tags): a known name is
// used as it was first written, and a name already in the list isn't added twice.
// Returns the same array when nothing changes.
export function addChip(
  current: readonly string[],
  input: string,
  known: readonly string[],
  max: number,
) {
  const name = input.trim();
  if (!name || current.length >= max || current.some((chip) => same(chip, name))) {
    return current;
  }
  return [...current, known.find((chip) => same(chip, name)) ?? name];
}

export function removeChip(current: readonly string[], name: string) {
  return current.filter((chip) => chip !== name);
}
