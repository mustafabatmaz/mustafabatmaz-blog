import { describe, expect, it } from "vitest";
import { listSearch, readListParams } from "./listParams";

describe("readListParams", () => {
  it("shouldStartOnFirstPageOfAllPosts_whenNothingIsGiven", () => {
    expect(readListParams(new URLSearchParams())).toEqual({ page: 1, status: undefined });
  });

  it("shouldReadPageAndStatus", () => {
    expect(readListParams(new URLSearchParams("page=3&status=DRAFT"))).toEqual({
      page: 3,
      status: "DRAFT",
    });
  });

  it("shouldFallBackToDefaults_whenValuesAreInvalid", () => {
    expect(readListParams(new URLSearchParams("page=0&status=SCHEDULED"))).toEqual({
      page: 1,
      status: undefined,
    });
    expect(readListParams(new URLSearchParams("page=iki"))).toEqual({ page: 1, status: undefined });
  });
});

describe("listSearch", () => {
  it("shouldLeaveOutDefaults_soTheFirstPageHasAPlainAddress", () => {
    expect(listSearch({ page: 1, status: undefined })).toBe("");
    expect(listSearch({ page: 2, status: "PUBLISHED" })).toBe("?page=2&status=PUBLISHED");
  });
});
