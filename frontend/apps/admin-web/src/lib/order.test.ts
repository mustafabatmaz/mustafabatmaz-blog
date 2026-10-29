import { describe, expect, it } from "vitest";
import { moveId } from "./order";

describe("moveId", () => {
  it("shouldSwapWithPrevious_whenMovingUp", () => {
    expect(moveId([1, 2, 3], 3, "up")).toEqual([1, 3, 2]);
  });

  it("shouldSwapWithNext_whenMovingDown", () => {
    expect(moveId([1, 2, 3], 1, "down")).toEqual([2, 1, 3]);
  });

  it("shouldReturnNull_whenItemIsAlreadyAtThatEnd", () => {
    expect(moveId([1, 2, 3], 1, "up")).toBeNull();
    expect(moveId([1, 2, 3], 3, "down")).toBeNull();
  });

  it("shouldReturnNull_whenIdIsUnknown", () => {
    expect(moveId([1, 2, 3], 9, "up")).toBeNull();
  });
});
