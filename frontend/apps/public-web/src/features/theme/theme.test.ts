// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyStoredTheme, THEME_KEY, themeScript, toggleTheme } from "./theme";

const runThemeScript = () => {
  // Runs the exact text the root layout puts in <head>
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- that string is what's under test
  (new Function(themeScript) as () => void)();
};

const blockStorage = (method: "getItem" | "setItem") => {
  vi.spyOn(Storage.prototype, method).mockImplementation(() => {
    throw new Error("blocked");
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

// The inline script runs before the first paint; applyStoredTheme does the same after React renders a page whose
// HTML came without it (Next's 404 shell). Both must behave the same.
describe.each([
  ["theme script", runThemeScript],
  ["applyStoredTheme", applyStoredTheme],
])("%s", (_name, apply) => {
  it("shouldStartDark_whenDarkWasChosenBefore", () => {
    localStorage.setItem(THEME_KEY, "dark");

    apply();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("shouldStayLight_whenNothingWasChosen", () => {
    apply();

    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("shouldStayLight_whenStorageIsBlocked", () => {
    blockStorage("getItem");

    expect(apply).not.toThrow();
    expect(document.documentElement).not.toHaveClass("dark");
  });
});

describe("toggleTheme", () => {
  it("shouldSwitchToDarkAndRememberIt_whenLight", () => {
    toggleTheme();

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("shouldSwitchBackToLight_whenDark", () => {
    document.documentElement.classList.add("dark");

    toggleTheme();

    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("shouldStillSwitch_whenStorageIsBlocked", () => {
    blockStorage("setItem");

    toggleTheme();

    expect(document.documentElement).toHaveClass("dark");
  });
});
