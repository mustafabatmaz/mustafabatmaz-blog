import { describe, expect, it } from "vitest";
import { securityHeaders } from "./securityHeaders";

const header = (isDev: boolean, key: string) =>
  securityHeaders(isDev).find((entry) => entry.key === key)?.value;

describe("securityHeaders", () => {
  it("shouldSendTheStaticSitePolicy_inProduction", () => {
    expect(header(false, "Content-Security-Policy")).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; " +
        "form-action 'self'; frame-ancestors 'none'",
    );
  });

  it("shouldAllowEval_onlyInDevelopment", () => {
    expect(header(true, "Content-Security-Policy")).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
    );
    expect(header(false, "Content-Security-Policy")).not.toContain("unsafe-eval");
  });

  it("shouldSendTheOtherHardeningHeaders", () => {
    expect(header(false, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(false, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(false, "Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });
});
