import { describe, expect, it } from "vitest";
import { topSkills } from "./skills";

// Experiences come newest first, as the API sends them
const experiences = [
  { projects: [{ technologies: ["Java 21", "Kafka", "Liquibase"] }] },
  {
    projects: [
      { technologies: ["Java 21", "Angular"] },
      { technologies: ["Java 21", "Kafka", "Oracle"] },
    ],
  },
];

describe("topSkills", () => {
  it("shouldPutTheMostUsedFirst", () => {
    expect(topSkills(experiences).slice(0, 2)).toEqual(["Java 21", "Kafka"]);
  });

  it("shouldPreferTheNewerExperience_whenCountsAreEqual", () => {
    // Liquibase, Angular and Oracle each appear once; Liquibase is in the newest experience
    expect(topSkills(experiences)[2]).toBe("Liquibase");
  });

  it("shouldStopAtTheLimit", () => {
    expect(topSkills(experiences, 3)).toHaveLength(3);
  });

  it("shouldBeEmpty_whenThereIsNoExperience", () => {
    expect(topSkills([])).toEqual([]);
  });
});
