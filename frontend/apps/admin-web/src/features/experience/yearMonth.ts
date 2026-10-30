import { tr } from "@/i18n/tr";

// The API works in months ("2025-06"); the form picks month and year separately
export interface MonthYear {
  month: string;
  year: string;
}

const monthName = new Intl.DateTimeFormat("tr-TR", { month: "long" });
const shortMonthYear = new Intl.DateTimeFormat("tr-TR", { month: "short", year: "numeric" });

export const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: monthName.format(new Date(2000, index, 1)),
}));

const FIRST_YEAR = 1990;

export function yearOptions(currentYear = new Date().getFullYear()) {
  return Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => String(currentYear - i));
}

export function toYearMonth({ month, year }: MonthYear) {
  return month && year ? `${year}-${month}` : undefined;
}

export function fromYearMonth(value: string | null | undefined): MonthYear {
  const [year = "", month = ""] = value?.split("-") ?? [];
  return { month, year };
}

function formatMonth(value: string) {
  const { month, year } = fromYearMonth(value);
  return shortMonthYear.format(new Date(Number(year), Number(month) - 1, 1));
}

// "Haz 2025 — Halen"
export function formatRange(start: string, end: string | null | undefined) {
  const from = start ? formatMonth(start) : "";
  return `${from} — ${end ? formatMonth(end) : tr.experience.current}`;
}
