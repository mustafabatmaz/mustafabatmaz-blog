const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// "26.10.2026 21:14", in the browser's time zone
export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}
