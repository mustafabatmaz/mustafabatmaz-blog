import { describe, expect, it } from "vitest";
import { decodeEmail, encodeEmail } from "./email";

describe("email obfuscation", () => {
  it("shouldGiveBackTheAddress_afterARoundTrip", () => {
    expect(decodeEmail(encodeEmail("mustafa@example.com"))).toBe("mustafa@example.com");
  });

  it("shouldHideTheAddress_inTheEncodedText", () => {
    const encoded = encodeEmail("mustafa@example.com");

    expect(encoded).not.toContain("@");
    expect(encoded).not.toContain("mustafa");
    expect(encoded).not.toContain("example");
  });

  it("shouldBeNull_whenTheTextIsNotAnEncodedAddress", () => {
    expect(decodeEmail("")).toBeNull();
    expect(decodeEmail("%%%")).toBeNull();
    expect(decodeEmail(encodeEmail("not-an-address"))).toBeNull();
  });
});
