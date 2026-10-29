import { describe, expect, it } from "vitest";
import { formatRange, fromYearMonth, MONTHS, toYearMonth, yearOptions } from "./yearMonth";

describe("yearMonth", () => {
  it("shouldNameMonthsInTurkish_inCalendarOrder", () => {
    expect(MONTHS.map((m) => m.label)).toEqual([
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ]);
    expect(MONTHS[5]?.value).toBe("06");
  });

  it("shouldJoinMonthAndYear_whenBothAreChosen", () => {
    expect(toYearMonth({ month: "06", year: "2025" })).toBe("2025-06");
  });

  it("shouldReturnUndefined_whenMonthOrYearIsMissing", () => {
    expect(toYearMonth({ month: "", year: "2025" })).toBeUndefined();
    expect(toYearMonth({ month: "06", year: "" })).toBeUndefined();
  });

  it("shouldSplitIntoMonthAndYear_whenLoadingFromApi", () => {
    expect(fromYearMonth("2025-06")).toEqual({ month: "06", year: "2025" });
    expect(fromYearMonth(undefined)).toEqual({ month: "", year: "" });
  });

  it("shouldListYearsNewestFirst_from1990ToGivenYear", () => {
    const years = yearOptions(2026);
    expect(years[0]).toBe("2026");
    expect(years.at(-1)).toBe("1990");
  });

  it("shouldFormatRangeWithCurrent_whenThereIsNoEnd", () => {
    expect(formatRange("2025-06", undefined)).toBe("Haz 2025 — Halen");
    expect(formatRange("2020-02", "2025-05")).toBe("Şub 2020 — May 2025");
  });
});
