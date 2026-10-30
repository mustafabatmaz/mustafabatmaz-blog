import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/problem";
import { checkFile, formatBytes, MAX_FILE_SIZE, uploadProblem } from "./mediaFiles";

const MB = 1024 * 1024;

describe("checkFile", () => {
  it("shouldAccept_whenTypeIsAllowedAndSizeFits", () => {
    expect(checkFile({ size: MAX_FILE_SIZE, type: "image/png" })).toBeNull();
    expect(checkFile({ size: 1, type: "image/avif" })).toBeNull();
  });

  it("shouldReject_whenFileIsEmpty", () => {
    expect(checkFile({ size: 0, type: "image/png" })).toBe("empty");
  });

  it("shouldReject_whenFileIsLargerThanFiveMegabytes", () => {
    expect(checkFile({ size: MAX_FILE_SIZE + 1, type: "image/jpeg" })).toBe("tooLarge");
  });

  it("shouldReject_whenBrowserReportsTypeThatIsNotAllowed", () => {
    expect(checkFile({ size: MB, type: "image/heic" })).toBe("unsupported");
    expect(checkFile({ size: MB, type: "image/svg+xml" })).toBe("unsupported");
  });

  it("shouldLeaveDecisionToBackend_whenBrowserReportsNoType", () => {
    expect(checkFile({ size: MB, type: "" })).toBeNull();
  });
});

describe("uploadProblem", () => {
  it("shouldExplainRejection_whenBackendAnswersWithKnownStatus", () => {
    expect(uploadProblem(new ApiError(413))).toBe("tooLarge");
    expect(uploadProblem(new ApiError(415))).toBe("unsupported");
    expect(uploadProblem(new ApiError(400))).toBe("invalid");
  });

  it("shouldFallBackToGenericFailure_whenErrorIsAnythingElse", () => {
    expect(uploadProblem(new ApiError(500))).toBe("failed");
    expect(uploadProblem(new TypeError("Failed to fetch"))).toBe("failed");
  });
});

describe("formatBytes", () => {
  it("shouldUseBytes_whenSmallerThanAKilobyte", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("shouldUseWholeKilobytes_whenSmallerThanAMegabyte", () => {
    expect(formatBytes(284 * 1024 + 300)).toBe("284 KB");
  });

  it("shouldUseOneDecimalWithTurkishComma_whenMegabytes", () => {
    expect(formatBytes(1.8 * MB)).toBe("1,8 MB");
    expect(formatBytes(5 * MB)).toBe("5 MB");
  });
});
