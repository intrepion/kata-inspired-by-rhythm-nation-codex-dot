import { tracks } from "./domain";
export class Sound {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  private voices: OscillatorNode[] = [];
  async activate(volume: number) {
    this.context ??= new AudioContext({ latencyHint: "interactive" });
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
    }
    this.setVolume(volume);
    await this.context.resume();
    if (this.context.state !== "running")
      throw new Error("Audio unavailable. Try Start again.");
  }
  setVolume(volume: number) {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        volume * 0.22,
        this.context.currentTime,
        0.02,
      );
  }
  tone(
    at: number,
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    power = 0.6,
  ) {
    if (!this.context || !this.master) return;
    const osc = this.context.createOscillator(),
      gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(power, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(at);
    osc.stop(at + duration + 0.01);
    this.voices.push(osc);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.voices = this.voices.filter((v) => v !== osc);
    };
  }
  schedule(index: number, start: number) {
    const t = tracks[index],
      beat = 60 / t.bpm;
    for (let b = 0; b < t.beats; b++) {
      const at = start + b * beat;
      this.tone(at, b % 4 === 0 ? 70 : 110, 0.12, "sine", 0.9);
      this.tone(at + beat * 0.5, 1600, 0.025, "triangle", 0.13);
      if (b >= 4) {
        const steps = [0, 7, 3, 10, 0, 5, 7, 3];
        this.tone(
          at,
          (t.root / 2) * Math.pow(2, steps[Math.floor(b / 4) % 8] / 12),
          beat * 0.8,
          "triangle",
          0.4,
        );
        this.tone(
          at + beat * 0.5,
          t.root * Math.pow(2, steps[b % 8] / 12),
          beat * 0.3,
          "sine",
          0.25,
        );
      }
    }
  }
  stop() {
    for (const v of [...this.voices])
      try {
        v.stop();
      } catch {}
    this.voices = [];
  }
  get now() {
    return this.context?.currentTime ?? 0;
  }
  async pause() {
    await this.context?.suspend();
  }
  async resume() {
    await this.context?.resume();
    if (this.context?.state !== "running")
      throw new Error("Audio did not resume. Try again.");
  }
}
