import { describe, expect, it } from "vitest";
import { groupByCategory, moveWithinCategory } from "./usesOrder";

// The backend keeps one sortOrder for the whole list; the site shows it grouped by category
const items = [
  { id: 1, category: "DEV_TOOLS" as const },
  { id: 2, category: "HARDWARE" as const },
  { id: 3, category: "DEV_TOOLS" as const },
  { id: 4, category: "DEV_TOOLS" as const },
];

describe("groupByCategory", () => {
  it("shouldGroupInCategoryOrderAndKeepListOrderInside_whenItemsAreMixed", () => {
    expect(groupByCategory(items).map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([
      ["HARDWARE", [2]],
      ["DEV_TOOLS", [1, 3, 4]],
    ]);
  });
});

describe("moveWithinCategory", () => {
  it("shouldSwapWithPreviousItemOfSameCategory_whenMovingUp", () => {
    expect(moveWithinCategory(items, 3, "up")).toEqual([3, 2, 1, 4]);
  });

  it("shouldSkipOtherCategories_whenMovingDown", () => {
    expect(moveWithinCategory(items, 1, "down")).toEqual([3, 2, 1, 4]);
  });

  it("shouldReturnNull_whenItemIsAlreadyFirstInItsCategory", () => {
    expect(moveWithinCategory(items, 2, "up")).toBeNull();
    expect(moveWithinCategory(items, 1, "up")).toBeNull();
  });

  it("shouldReturnNull_whenItemIsAlreadyLastInItsCategory", () => {
    expect(moveWithinCategory(items, 4, "down")).toBeNull();
  });
});
