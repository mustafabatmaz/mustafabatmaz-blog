// Swaps an id with its neighbour and returns the whole list in the new order (what the /order endpoints
// expect), or null when the id is already at that end
export function moveId(
  ids: readonly number[],
  id: number,
  direction: "up" | "down",
): number[] | null {
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) {
    return null;
  }
  const moved = [...ids];
  [moved[from], moved[to]] = [ids[to] ?? id, id];
  return moved;
}
