import { describe, expect, it } from "vitest";
import { isAuthorized } from "./revalidate";

describe("isAuthorized", () => {
  it("shouldAccept_onlyTheBearerSecret", () => {
    expect(isAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorized("Bearer s3cre", "s3cret")).toBe(false);
    expect(isAuthorized("s3cret", "s3cret")).toBe(false);
    expect(isAuthorized(null, "s3cret")).toBe(false);
  });

  it("shouldRefuseEverything_whenNoSecretIsConfigured", () => {
    expect(isAuthorized("Bearer ", "")).toBe(false);
    expect(isAuthorized("Bearer ", undefined)).toBe(false);
    expect(isAuthorized("Bearer undefined", undefined)).toBe(false);
  });
});
