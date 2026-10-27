export type Theme = "light" | "dark";

const STORAGE_KEY = "admin-theme";

// Light is the approved default. Storage can throw (private mode, blocked site data), so it is optional.
export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice just won't survive a reload
  }
}
