import { describe, expect, it } from "vitest";
import { readLoginState } from "./loginState";

describe("readLoginState", () => {
  it("shouldKeepRequestedPage_whenItIsAnInternalPath", () => {
    expect(readLoginState({ from: "/posts?page=2", expired: true })).toEqual({
      from: "/posts?page=2",
      expired: true,
    });
  });

  it("shouldFallBackToHome_whenPathPointsToAnotherSite", () => {
    expect(readLoginState({ from: "//evil.example/phish" }).from).toBe("/");
  });

  it("shouldFallBackToDefaults_whenStateIsMissing", () => {
    expect(readLoginState(null)).toEqual({ from: "/", expired: false });
  });
});
