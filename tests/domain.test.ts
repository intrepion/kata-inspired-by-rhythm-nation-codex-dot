import { test } from "node:test";
import assert from "node:assert/strict";
import { judge } from "../src/domain.ts";
test("inclusive timing windows are symmetric", () => {
  assert.equal(judge(0.045), "Perfect");
  assert.equal(judge(-0.1), "Good");
  assert.equal(judge(0.16), "Close");
  assert.equal(judge(0.161), "Miss");
});
import {
  createRun,
  press,
  expire,
  accuracy,
  chart,
  parseSave,
} from "../src/domain.ts";
test("orb cannot score twice; an empty press breaks combo", () => {
  const r = createRun(0);
  const o = r.orbs[0];
  assert.equal(press(r, o.lane, o.time).result, "Perfect");
  assert.equal(r.score, 1000);
  assert.equal(r.combo, 1);
  assert.equal(press(r, o.lane, o.time).result, "Empty");
  assert.equal(r.score, 1000);
  assert.equal(r.combo, 0);
});
test("misses expire once, inclusive late edge still hits", () => {
  const r = createRun(0),
    o = r.orbs[0];
  expire(r, o.time + 0.16);
  assert.equal(r.counts.Miss, 0);
  assert.equal(press(r, o.lane, o.time + 0.16).result, "Close");
  expire(r, 100);
  expire(r, 100);
  assert.equal(r.counts.Miss, r.orbs.length - 1);
  assert.equal(r.counts.Close, 1);
});
test("perfect full chart scores, chords are independent, multiplier caps", () => {
  const r = createRun(3);
  for (const o of r.orbs)
    assert.equal(press(r, o.lane, o.time).result, "Perfect");
  assert.equal(accuracy(r), 100);
  assert.equal(r.maxCombo, r.orbs.length);
  assert.equal(r.counts.Miss, 0);
  assert.equal(r.strays, 0);
  assert.equal(r.score, 107000);
});
test("charts are ordered, playable and increasingly dense", () => {
  let previous = 0;
  for (let i = 0; i < 4; i++) {
    const notes = chart(i);
    assert.ok(notes.length > previous);
    previous = notes.length;
    for (let j = 0; j < notes.length; j++) {
      assert.ok(notes[j].lane >= 0 && notes[j].lane < 4);
      if (j) assert.ok(notes[j].time >= notes[j - 1].time);
      assert.equal(
        notes.filter(
          (o) => o.lane === notes[j].lane && o.time === notes[j].time,
        ).length,
        1,
      );
    }
  }
});
test("storage tolerates corrupt and hostile values", () => {
  assert.deepEqual(parseSave("oops"), {
    offset: 0,
    volume: 0.5,
    bests: [0, 0, 0, 0],
  });
  assert.deepEqual(
    parseSave('{"offset":900,"volume":-2,"bests":[12,-4,"bad"]}'),
    { offset: 200, volume: 0, bests: [12, 0, 0, 0] },
  );
});
