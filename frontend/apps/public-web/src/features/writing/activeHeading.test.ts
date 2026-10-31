import { describe, expect, it } from "vitest";
import { activeHeading } from "./activeHeading";

const headings = [
  { id: "belirti", top: -400 },
  { id: "cozum", top: 40 },
  { id: "sonuc", top: 900 },
];

describe("activeHeading", () => {
  it("shouldPickTheLastHeading_thatHasReachedTheTopOfTheScreen", () => {
    expect(activeHeading(headings, 120)).toBe("cozum");
  });

  it("shouldPickTheFirstHeading_beforeAnyHasReachedTheTop", () => {
    expect(
      activeHeading(
        [
          { id: "belirti", top: 300 },
          { id: "cozum", top: 800 },
        ],
        120,
      ),
    ).toBe("belirti");
  });

  it("shouldBeNull_withoutHeadings", () => {
    expect(activeHeading([], 120)).toBeNull();
  });
});
