import { describe, expect, it } from "vitest";
import { addTechnology, MAX_TECHNOLOGIES, removeTechnology } from "./technologies";

const known = ["Spring Boot", "Kafka", "PostgreSQL"];

describe("addTechnology", () => {
  it("shouldAddTrimmedName_whenItIsNew", () => {
    expect(addTechnology(["Java 21"], "  Liquibase ", known)).toEqual(["Java 21", "Liquibase"]);
  });

  it("shouldUseKnownSpelling_whenNameDiffersOnlyInCase", () => {
    expect(addTechnology([], "spring boot", known)).toEqual(["Spring Boot"]);
  });

  it("shouldIgnoreName_whenItIsAlreadyInTheList", () => {
    expect(addTechnology(["Kafka"], "KAFKA", known)).toEqual(["Kafka"]);
  });

  it("shouldIgnoreBlankName", () => {
    expect(addTechnology(["Kafka"], "   ", known)).toEqual(["Kafka"]);
  });

  it("shouldStopAdding_whenListIsFull", () => {
    const full = Array.from({ length: MAX_TECHNOLOGIES }, (_, i) => `Tech ${String(i)}`);
    expect(addTechnology(full, "Kafka", known)).toBe(full);
  });
});

describe("removeTechnology", () => {
  it("shouldRemoveOnlyTheGivenName", () => {
    expect(removeTechnology(["Java 21", "Kafka", "Spring Boot"], "Kafka")).toEqual([
      "Java 21",
      "Spring Boot",
    ]);
  });
});
