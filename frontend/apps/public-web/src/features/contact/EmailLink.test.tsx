// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { encodeEmail } from "@/lib/email";
import { EmailLink } from "./EmailLink";

describe("EmailLink", () => {
  it("shouldBecomeAMailtoLink_afterItMounts", async () => {
    render(<EmailLink encoded={encodeEmail("mustafa@example.com")} label="E-posta" className="" />);

    expect(await screen.findByRole("link", { name: "E-posta" })).toHaveAttribute(
      "href",
      "mailto:mustafa@example.com",
    );
  });
});
