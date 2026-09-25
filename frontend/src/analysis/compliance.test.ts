import { describe, expect, it } from "vitest";

import rules from "../../../shared/contract-rules.json";
import cases from "./compliance.expected.json";
import { isLikelyContract, scanContract, type RiskFlag } from "./compliance";

interface ExpectedCase {
  name: string;
  text: string;
  is_contract: boolean;
  flags: RiskFlag[];
}

const samples = cases as ExpectedCase[];

describe("compliance parity with shared/contract-rules.json", () => {
  it("covers more than one sample", () => {
    expect(samples.length).toBeGreaterThanOrEqual(4);
  });

  it("uses clause labels and severities from the shared rules", () => {
    const flags = scanContract("This note is not a contract.");
    for (const clause of rules.missingClauses.clauses) {
      const match = flags.find((flag) => flag.title === `Missing: ${clause.label}`);
      expect(match?.severity).toBe(rules.missingClauses.severity);
      expect(match?.type).toBe(rules.missingClauses.type);
    }
  });

  for (const sample of samples) {
    it(sample.name, () => {
      expect(isLikelyContract(sample.text)).toBe(sample.is_contract);
      expect(scanContract(sample.text)).toEqual(sample.flags);
    });
  }
});
