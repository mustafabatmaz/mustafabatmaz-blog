import { describe, expect, it } from "vitest";
import { yearOf, yearRange } from "./years";

describe("yearRange", () => {
  it("shouldShowBothYears_whenTheyDiffer", () => {
    expect(yearRange(2020, 2025, "şimdi")).toBe("2020 — 2025");
  });

  it("shouldShowOneYear_whenStartAndEndAreTheSame", () => {
    expect(yearRange(2020, 2020, "şimdi")).toBe("2020");
  });

  it("shouldSayPresent_whenThereIsNoEnd", () => {
    expect(yearRange(2025, null, "now")).toBe("2025 — now");
    expect(yearRange(2025, undefined, "şimdi")).toBe("2025 — şimdi");
  });
});

describe("yearOf", () => {
  it("shouldReadTheYear_fromAYearMonth", () => {
    expect(yearOf("2025-06")).toBe(2025);
  });

  it("shouldBeNull_whenThereIsNoMonth", () => {
    expect(yearOf(null)).toBeNull();
    expect(yearOf(undefined)).toBeNull();
  });
});
