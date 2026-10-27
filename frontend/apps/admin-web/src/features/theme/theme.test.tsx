import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  return screen.getByRole("button", { name: "Temayı değiştir" });
}

describe("theme", () => {
  it("shouldStartLight_whenNothingIsStored", () => {
    renderToggle();

    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("shouldRestoreDark_whenItWasChosenBefore", () => {
    localStorage.setItem("admin-theme", "dark");

    renderToggle();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("shouldApplyAndRemember_whenToggled", async () => {
    const toggle = renderToggle();

    await userEvent.setup().click(toggle);

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("admin-theme")).toBe("dark");
  });

  it("shouldIgnoreStoredValue_whenItIsNotATheme", () => {
    localStorage.setItem("admin-theme", "purple");

    renderToggle();

    expect(document.documentElement).not.toHaveClass("dark");
  });
});
