import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";

// Every key path of a messages object, e.g. "nav.writing"
function keys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]: [string, unknown]) =>
    typeof child === "object" && child !== null
      ? keys(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("messages", () => {
  it("shouldHaveTheSameKeys_inBothLanguages", () => {
    expect(keys(en).sort()).toEqual(keys(tr).sort());
  });
});
