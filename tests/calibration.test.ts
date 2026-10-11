import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptTap, calibratedOffset } from "../src/calibration.ts";
test("skipping a click cannot allow duplicates on another click", () => {
  let taps = acceptTap([], 4.2);
  for (let i = 0; i < 8; i++) taps = acceptTap(taps, 4.21);
  assert.equal(taps.length, 1);
  assert.equal(calibratedOffset(taps), null);
});
test("calibration ignores early, late and out of range taps", () => {
  assert.deepEqual(acceptTap([], -1), []);
  assert.deepEqual(acceptTap([], 7), []);
  assert.deepEqual(acceptTap([], 0.3), []);
});
test("median of eight separate clicks estimates late input and leaves samples unchanged", () => {
  let taps = [] as ReturnType<typeof acceptTap>;
  for (let i = 0; i < 8; i++) taps = acceptTap(taps, i * 0.6 + 0.08);
  const before = structuredClone(taps);
  assert.equal(calibratedOffset(taps), 80);
  assert.deepEqual(taps, before);
});
