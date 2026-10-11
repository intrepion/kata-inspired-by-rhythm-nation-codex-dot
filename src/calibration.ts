export interface Tap {
  beat: number;
  delta: number;
}
export function acceptTap(taps: readonly Tap[], elapsed: number): Tap[] {
  const beat = Math.round(elapsed / 0.6),
    delta = (elapsed - beat * 0.6) * 1000;
  if (
    beat < 0 ||
    beat > 7 ||
    Math.abs(delta) > 250 ||
    taps.some((t) => t.beat === beat)
  )
    return [...taps];
  return [...taps, { beat, delta }];
}
export function calibratedOffset(taps: readonly Tap[]): number | null {
  if (taps.length < 4) return null;
  const sorted = taps.map((t) => t.delta).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2),
    median =
      sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
  return Math.max(-200, Math.min(200, Math.round(median / 5) * 5));
}
