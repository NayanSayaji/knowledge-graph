import { describe, expect, it } from "vitest";
import { mergeChipValues } from "./ChipInput";

describe("mergeChipValues", () => {
  it("turns comma-separated text into distinct values", () => {
    expect(
      mergeChipValues(["Backend"], "distributed systems, BACKEND, caching"),
    ).toEqual(["BACKEND", "distributed systems", "caching"]);
  });

  it("limits every value to 25 characters", () => {
    expect(
      mergeChipValues([], "a-value-that-is-longer-than-twenty-five-characters"),
    ).toEqual(["a-value-that-is-longer-th"]);
  });

  it("ignores empty comma-separated values", () => {
    expect(mergeChipValues(["HLD"], " , , ")).toEqual(["HLD"]);
  });
});
