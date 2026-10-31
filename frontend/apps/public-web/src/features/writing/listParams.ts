// The page number in /writing/page/2: a whole number from 1 up, nothing else (5c decision 7). The backend
// answers 400 to page 0, so a bad value never reaches it; the page turns it into a 404.
export function parsePage(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  return Number(value);
}
