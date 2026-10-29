import { describe, expect, it } from "vitest";
import { saveStatusText } from "./saveStatusText";

const savedAt = new Date(2026, 9, 27, 14, 32);

describe("saveStatusText", () => {
  it("shouldSaySaving_whenRequestIsRunning", () => {
    expect(saveStatusText({ isDirty: true, isSaving: true, savedAt })).toBe("Kaydediliyor…");
  });

  it("shouldWarnAboutChanges_whenFormDiffersFromSavedData", () => {
    expect(saveStatusText({ isDirty: true, isSaving: false, savedAt })).toBe(
      "Kaydedilmemiş değişiklikler var",
    );
  });

  it("shouldShowSaveTime_whenLastSaveSucceeded", () => {
    expect(saveStatusText({ isDirty: false, isSaving: false, savedAt })).toBe(
      "✓ Kaydedildi · 14:32",
    );
  });

  it("shouldStayEmpty_whenNothingChangedOrWasSaved", () => {
    expect(saveStatusText({ isDirty: false, isSaving: false })).toBe("");
  });
});
