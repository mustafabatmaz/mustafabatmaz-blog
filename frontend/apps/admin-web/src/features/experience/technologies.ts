// Same limit as the backend's ProjectAdminRequest
export const MAX_TECHNOLOGIES = 30;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// The backend matches technologies ignoring case and keeps the first spelling, so the form does the same:
// a known name is used as it was first written, and a name already in the list isn't added twice.
// Returns the same array when nothing changes.
export function addTechnology(current: readonly string[], input: string, known: readonly string[]) {
  const name = input.trim();
  if (!name || current.length >= MAX_TECHNOLOGIES || current.some((t) => same(t, name))) {
    return current;
  }
  return [...current, known.find((t) => same(t, name)) ?? name];
}

export function removeTechnology(current: readonly string[], name: string) {
  return current.filter((t) => t !== name);
}
