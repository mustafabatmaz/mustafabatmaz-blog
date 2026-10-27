import { describe, expect, it } from "vitest";
import { readCsrfToken } from "./csrf";

describe("readCsrfToken", () => {
  it("shouldReturnToken_whenCookieIsAmongOthers", () => {
    expect(readCsrfToken("theme=dark; XSRF-TOKEN=abc-123; other=1")).toBe("abc-123");
  });

  it("shouldReturnUndefined_whenCookieIsMissing", () => {
    expect(readCsrfToken("theme=dark")).toBeUndefined();
  });

  it("shouldDecodeValue_whenCookieIsUrlEncoded", () => {
    expect(readCsrfToken("XSRF-TOKEN=a%3Db")).toBe("a=b");
  });
});
