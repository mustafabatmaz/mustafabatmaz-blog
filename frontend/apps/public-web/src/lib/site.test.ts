import { describe, expect, it } from "vitest";
import { readSiteUrl } from "./site";

describe("readSiteUrl", () => {
  it("shouldUseTheConfiguredAddress", () => {
    expect(readSiteUrl("https://mustafabatmaz.com", "production").href).toBe(
      "https://mustafabatmaz.com/",
    );
  });

  it("shouldFallBackToLocalhost_inDevelopment", () => {
    expect(readSiteUrl(undefined, "development").href).toBe("http://localhost:3000/");
  });

  it("shouldFailLoudly_whenMissingInProduction", () => {
    expect(() => readSiteUrl(undefined, "production")).toThrow(/SITE_URL/);
    expect(() => readSiteUrl("", "production")).toThrow(/SITE_URL/);
  });

  it("shouldReject_anAddressThatIsNotAPlainHttpOrigin", () => {
    expect(() => readSiteUrl("mustafabatmaz.com", "production")).toThrow(/SITE_URL/);
    expect(() => readSiteUrl("https://mustafabatmaz.com/", "production")).toThrow(/SITE_URL/);
    expect(() => readSiteUrl("ftp://mustafabatmaz.com", "production")).toThrow(/SITE_URL/);
  });
});
