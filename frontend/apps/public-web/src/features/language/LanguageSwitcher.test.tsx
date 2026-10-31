// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Next's router isn't mounted in a unit test; only the current address is faked (5a decision 7)
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/tr/about",
}));

function renderSwitcher() {
  render(
    <NextIntlClientProvider locale="tr" messages={{}}>
      <LanguageSwitcher label="Dil" names={{ tr: "Türkçe", en: "English" }} />
    </NextIntlClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  it("shouldLinkToTheSamePage_inTheOtherLanguage", () => {
    renderSwitcher();

    const english = screen.getByRole("link", { name: "English" });
    expect(english).toHaveAttribute("href", "/en/about");
    expect(english).toHaveAttribute("hreflang", "en");
  });

  it("shouldShowTheCurrentLanguage_asTextNotALink", () => {
    renderSwitcher();

    expect(screen.queryByRole("link", { name: "Türkçe" })).not.toBeInTheDocument();
    expect(screen.getByText("TR")).toHaveAttribute("aria-current", "true");
  });
});
