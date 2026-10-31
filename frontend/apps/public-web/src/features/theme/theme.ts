// Light is the default (PROJECT_DECISION.md §6); a visitor's choice of dark is remembered in this browser only.
export const THEME_KEY = "public-theme";

// Runs in <head> before the first paint, so a dark-theme visitor never sees a white flash. Fixed text with no
// visitor data in it; the page's CSP allows inline scripts (5a decision 5).
export const themeScript = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

// The same check for pages whose HTML came without the inline script: Next sends a bare shell for a 404 and
// React renders it in the browser, where a script added by React doesn't run
export function applyStoredTheme() {
  try {
    if (localStorage.getItem(THEME_KEY) === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // Storage blocked: stay light
  }
}

export function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // Storage can be blocked (private mode); the switch still works for this page view
  }
}
