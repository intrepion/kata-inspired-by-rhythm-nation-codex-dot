export type Judgement = "Perfect" | "Good" | "Close" | "Miss";
export function judge(delta: number): Judgement {
  const ms = Math.abs(delta) * 1000;
  return ms <= 45.000001
    ? "Perfect"
    : ms <= 100.000001
      ? "Good"
      : ms <= 160.000001
        ? "Close"
        : "Miss";
}
export interface Orb {
  time: number;
  lane: number;
  hit?: Judgement;
}
export interface Run {
  orbs: Orb[];
  score: number;
  combo: number;
  maxCombo: number;
  counts: Record<Judgement, number>;
  strays: number;
}
export const tracks = [
  {
    name: "First light",
    bpm: 90,
    beats: 16,
    level: "Tutorial",
    subtitle: "Learn the four signals",
    root: 220,
  },
  {
    name: "Solar drift",
    bpm: 100,
    beats: 32,
    level: "01 / Easy",
    subtitle: "A steady pulse through the dusk",
    root: 261.63,
  },
  {
    name: "Prism current",
    bpm: 120,
    beats: 40,
    level: "02 / Medium",
    subtitle: "Offbeats and paired signals",
    root: 293.66,
  },
  {
    name: "Midnight circuit",
    bpm: 140,
    beats: 48,
    level: "03 / Hard",
    subtitle: "Fast switches. Double the energy.",
    root: 329.63,
  },
];
export function chart(index: number): Orb[] {
  const track = tracks[index];
  const orbs: Orb[] = [];
  for (let b = 4; b < track.beats; b++) {
    orbs.push({
      time: (b * 60) / track.bpm,
      lane: (b * 3 + Math.floor(b / 4)) % 4,
    });
    if (index >= 2 && b % 4 === 2)
      orbs.push({ time: ((b + 0.5) * 60) / track.bpm, lane: (b + 2) % 4 });
    if (index === 3 && b % 4 === 0)
      orbs.push({
        time: (b * 60) / track.bpm,
        lane: (b * 3 + Math.floor(b / 4) + 2) % 4,
      });
  }
  return orbs.sort((a, b) => a.time - b.time);
}
export function createRun(index: number): Run {
  return {
    orbs: chart(index),
    score: 0,
    combo: 0,
    maxCombo: 0,
    counts: { Perfect: 0, Good: 0, Close: 0, Miss: 0 },
    strays: 0,
  };
}
function record(run: Run, orb: Orb, result: Judgement) {
  orb.hit = result;
  run.counts[result]++;
  if (result === "Miss") {
    run.combo = 0;
    return;
  }
  run.combo++;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  run.score +=
    { Perfect: 1000, Good: 700, Close: 300 }[result] *
    (1 + Math.min(4, Math.floor((run.combo - 1) / 10)) * 0.25);
}
function expireMutable(run: Run, time: number) {
  for (const orb of run.orbs)
    if (!orb.hit && time - orb.time > 0.160000001) record(run, orb, "Miss");
}
function pressMutable(
  run: Run,
  lane: number,
  time: number,
): { result: Judgement | "Empty"; delta: number } {
  expireMutable(run, time);
  const orb = run.orbs
    .filter(
      (o) =>
        !o.hit && o.lane === lane && Math.abs(time - o.time) <= 0.160000001,
    )
    .sort((a, b) => Math.abs(time - a.time) - Math.abs(time - b.time))[0];
  if (!orb) {
    run.combo = 0;
    run.strays++;
    return { result: "Empty", delta: 0 };
  }
  const delta = time - orb.time,
    result = judge(delta);
  record(run, orb, result);
  return { result, delta };
}
export function accuracy(run: Run) {
  return Math.round(
    ((run.counts.Perfect + run.counts.Good * 0.7 + run.counts.Close * 0.3) /
      run.orbs.length) *
      100,
  );
}
export interface Save {
  offset: number;
  volume: number;
  bests: number[];
}
export function parseSave(raw: string | null): Save {
  let data: Partial<Save> = {};
  try {
    data = JSON.parse(raw ?? "{}") ?? {};
  } catch {}
  return {
    offset:
      typeof data.offset === "number" && Number.isFinite(data.offset)
        ? Math.max(-200, Math.min(200, data.offset))
        : 0,
    volume:
      typeof data.volume === "number" && Number.isFinite(data.volume)
        ? Math.max(0, Math.min(1, data.volume))
        : 0.5,
    bests: Array.from({ length: 4 }, (_, i) =>
      Array.isArray(data.bests) && Number.isFinite(data.bests[i])
        ? Math.max(0, Math.floor(data.bests[i]))
        : 0,
    ),
  };
}

export function expire(run: Run, time: number): Run {
  if (!run.orbs.some((o) => !o.hit && time - o.time > 0.160000001)) return run;
  const next = structuredClone(run);
  expireMutable(next, time);
  return next;
}
export function press(run: Run, lane: number, time: number) {
  const next = structuredClone(run);
  const feedback = pressMutable(next, lane, time);
  return { ...feedback, run: next };
}
