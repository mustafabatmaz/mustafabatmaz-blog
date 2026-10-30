import { describe, expect, it } from "vitest";
import { addChip, removeChip } from "./chips";

const known = ["Spring Boot", "Kafka", "PostgreSQL"];
const max = 30;

describe("addChip", () => {
  it("shouldAddTrimmedName_whenItIsNew", () => {
    expect(addChip(["Java 21"], "  Liquibase ", known, max)).toEqual(["Java 21", "Liquibase"]);
  });

  it("shouldUseKnownSpelling_whenNameDiffersOnlyInCase", () => {
    expect(addChip([], "spring boot", known, max)).toEqual(["Spring Boot"]);
  });

  it("shouldIgnoreName_whenItIsAlreadyInTheList", () => {
    expect(addChip(["Kafka"], "KAFKA", known, max)).toEqual(["Kafka"]);
  });

  it("shouldIgnoreBlankName", () => {
    expect(addChip(["Kafka"], "   ", known, max)).toEqual(["Kafka"]);
  });

  it("shouldStopAdding_whenListIsFull", () => {
    const full = Array.from({ length: 10 }, (_, i) => `Etiket ${String(i)}`);
    expect(addChip(full, "Kafka", known, 10)).toBe(full);
  });
});

describe("removeChip", () => {
  it("shouldRemoveOnlyTheGivenName", () => {
    expect(removeChip(["Java 21", "Kafka", "Spring Boot"], "Kafka")).toEqual([
      "Java 21",
      "Spring Boot",
    ]);
  });
});
