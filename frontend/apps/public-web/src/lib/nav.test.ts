import { describe, expect, it } from "vitest";
import { isCurrentSection } from "./nav";

describe("isCurrentSection", () => {
  it("shouldMarkTheSection_whenOnItsListPage", () => {
    expect(isCurrentSection("/writing", "/writing")).toBe(true);
  });

  it("shouldMarkTheSection_whenOnOneOfItsPages", () => {
    expect(isCurrentSection("/writing/kafkada-kaybolan-eventler", "/writing")).toBe(true);
  });

  it("shouldNotMarkASection_whoseNameOnlyStartsTheSame", () => {
    expect(isCurrentSection("/uses-old", "/uses")).toBe(false);
  });

  it("shouldNotMarkAnySection_onTheHomePage", () => {
    expect(isCurrentSection("/", "/writing")).toBe(false);
  });
});
