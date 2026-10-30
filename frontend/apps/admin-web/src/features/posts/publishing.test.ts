import { describe, expect, it } from "vitest";
import { fromLocalInput, postState, publishedAtFor, toLocalInput } from "./publishing";

// Local dates, so the tests read the same in any time zone
const now = new Date(2026, 9, 30, 12, 0);
const lastWeek = new Date(2026, 9, 23, 9, 30).toISOString();
const nextWeek = new Date(2026, 10, 6, 9, 0).toISOString();

describe("local date-time input", () => {
  it("shouldShowInstantInLocalTime_whenFillingTheInput", () => {
    expect(toLocalInput(new Date(2026, 10, 3, 9, 5).toISOString())).toBe("2026-11-03T09:05");
  });

  it("shouldReadInputAsLocalTime_whenConvertingBack", () => {
    expect(fromLocalInput("2026-11-03T09:05")).toBe(new Date(2026, 10, 3, 9, 5).toISOString());
  });

  it("shouldReturnUndefined_whenInputIsEmptyOrInvalid", () => {
    expect(fromLocalInput("")).toBeUndefined();
    expect(fromLocalInput("yarın")).toBeUndefined();
  });
});

describe("postState", () => {
  it("shouldTellDraftsScheduledAndPublishedApart", () => {
    expect(postState({ status: "DRAFT", scheduled: false })).toBe("draft");
    expect(postState({ status: "PUBLISHED", scheduled: true })).toBe("scheduled");
    expect(postState({ status: "PUBLISHED", scheduled: false })).toBe("published");
  });
});

describe("publishedAtFor", () => {
  it("shouldKeepEarlierPublishDate_whenPostIsMovedBackToDraft", () => {
    expect(publishedAtFor("draft", "", { publishedAt: lastWeek }, now)).toBe(lastWeek);
  });

  it("shouldSendNoDate_whenDraftWasNeverPublished", () => {
    expect(publishedAtFor("draft", "", null, now)).toBeUndefined();
  });

  it("shouldKeepOriginalDate_whenPublishedPostStaysPublished", () => {
    expect(publishedAtFor("published", "", { publishedAt: lastWeek }, now)).toBe(lastWeek);
  });

  it("shouldLetBackendUseNow_whenPublishingForTheFirstTime", () => {
    expect(publishedAtFor("published", "", null, now)).toBeUndefined();
  });

  it("shouldLetBackendUseNow_whenScheduledPostIsPublishedEarly", () => {
    expect(publishedAtFor("published", "", { publishedAt: nextWeek }, now)).toBeUndefined();
  });

  it("shouldSendChosenMoment_whenScheduling", () => {
    expect(publishedAtFor("scheduled", "2026-11-06T09:00", null, now)).toBe(nextWeek);
  });
});
