// "2020 — 2025", "2025 — şimdi", or just "2020" when it started and ended the same year (C-Home, C-Experience)
export function yearRange(start: number, end: number | null | undefined, present: string) {
  if (end === start) {
    return String(start);
  }
  return `${String(start)} — ${end == null ? present : String(end)}`;
}

// The API writes months as "2025-06"
export function yearOf(yearMonth: string | null | undefined): number | null {
  return yearMonth ? Number(yearMonth.slice(0, 4)) : null;
}
