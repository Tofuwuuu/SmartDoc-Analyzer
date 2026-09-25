import { describe, expect, it } from "vitest";

import cases from "./compliance.expected.json";
import { isLikelyContract, scanContract, type RiskFlag } from "./compliance";

interface ExpectedCase {
  name: string;
  text: string;
  is_contract: boolean;
  flags: RiskFlag[];
}

const samples = cases as ExpectedCase[];

describe("compliance parity with backend/app/services/compliance.py", () => {
  it("covers more than one sample", () => {
    expect(samples.length).toBeGreaterThanOrEqual(4);
  });

  for (const sample of samples) {
    it(sample.name, () => {
      expect(isLikelyContract(sample.text)).toBe(sample.is_contract);
      expect(scanContract(sample.text)).toEqual(sample.flags);
    });
  }
});
