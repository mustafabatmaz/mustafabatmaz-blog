"use client";

import { useEffect } from "react";
import { applyStoredTheme } from "./theme";

// Renders nothing; after React has taken over the page it applies the remembered theme once. On normal pages
// the inline script already did that before the first paint, so this changes nothing there.
export function ThemeSync() {
  useEffect(applyStoredTheme, []);
  return null;
}
