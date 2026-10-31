import { describe, expect, it } from "vitest";
import { parsePage } from "./listParams";

describe("parsePage", () => {
  it("shouldReadAPageNumber", () => {
    expect(parsePage("2")).toBe(2);
  });

  it("shouldRejectAnythingButAWholePositiveNumber", () => {
    for (const value of ["0", "-1", "abc", "2.5", "", "02x", "1e3"]) {
      expect(parsePage(value)).toBeNull();
    }
  });
});
