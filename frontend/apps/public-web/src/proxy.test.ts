import { NextRequest } from "next/server";
import { getRedirectUrl, unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("shouldRedirectToEnglish_whenBrowserPrefersEnglish", () => {
    const response = proxy(request("/", { "accept-language": "en-US,en;q=0.9" }));

    expect(getRedirectUrl(response)).toBe("http://localhost:3000/en");
  });

  it("shouldRedirectToTurkish_whenBrowserLanguageIsUnknown", () => {
    const response = proxy(request("/", { "accept-language": "de-DE" }));

    expect(getRedirectUrl(response)).toBe("http://localhost:3000/tr");
  });

  it("shouldPreferTheChosenLanguage_overTheBrowserLanguage", () => {
    const response = proxy(request("/", { "accept-language": "en", cookie: "NEXT_LOCALE=tr" }));

    expect(getRedirectUrl(response)).toBe("http://localhost:3000/tr");
  });

  it("shouldKeepThePath_whenAddingTheLanguage", () => {
    const response = proxy(request("/writing", { "accept-language": "en" }));

    expect(getRedirectUrl(response)).toBe("http://localhost:3000/en/writing");
  });

  it("shouldLeavePrefixedPathsAlone_whenLinkIsShared", () => {
    const response = proxy(request("/tr/about", { "accept-language": "en" }));

    expect(getRedirectUrl(response)).toBeNull();
  });

  it("shouldNotSendHreflangHeader_becauseSlugsDifferPerLanguage", () => {
    const response = proxy(request("/tr/about"));

    expect(response.headers.get("link")).toBeNull();
  });

  it("shouldNotRun_forStaticFilesAndTheApi", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "/_next/static/chunks/main.js" })).toBe(
      false,
    );
    expect(unstable_doesMiddlewareMatch({ config, url: "/api/public/media/a.webp" })).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, url: "/favicon.ico" })).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, url: "/en/writing" })).toBe(true);
  });
});
