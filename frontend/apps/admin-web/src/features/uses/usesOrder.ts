import { CATEGORIES, type UsesCategory } from "./usesSchema";

interface Ordered {
  id?: number | undefined;
  category?: UsesCategory | undefined;
}

// Items arrive sorted by their global sortOrder; grouping keeps that order inside each category
export function groupByCategory<T extends Ordered>(items: readonly T[]) {
  return CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

// Swaps the item with its neighbour of the same category and returns every id in the new order,
// which is what PUT /uses/order expects. null when the item is already at that end of its category.
export function moveWithinCategory(
  items: readonly Ordered[],
  id: number,
  direction: "up" | "down",
): number[] | null {
  const from = items.findIndex((item) => item.id === id);
  const category = items[from]?.category;
  if (from === -1 || !category) {
    return null;
  }
  const step = direction === "up" ? -1 : 1;
  let to = from + step;
  while (to >= 0 && to < items.length && items[to]?.category !== category) {
    to += step;
  }
  if (to < 0 || to >= items.length) {
    return null;
  }
  const ids = items.map((item) => item.id ?? 0);
  [ids[from], ids[to]] = [ids[to] ?? 0, ids[from] ?? 0];
  return ids;
}
