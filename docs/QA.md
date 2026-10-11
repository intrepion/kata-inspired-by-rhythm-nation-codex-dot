# Validation evidence — 2026-10-11

## Numerical checks

Nine Node/tsx tests pass. Timing edges are inclusive and symmetric: 45/100/160ms, with 161ms missing. Hit orbs cannot score twice. Empty presses break combo; expiry records misses once. All 66 Hard orbs at exact chart time produce 100% accuracy and 107,000 points (10,000 + 12,500 + 15,000 + 17,500 + 26 × 2,000). Pure run transitions leave their input unchanged. Charts are ordered and have no duplicate same-lane notes at one time. Malformed saved data is sanitized. Calibration accepts unique beat indices and rejects repeated taps after skipped clicks; eight independent +80ms samples estimate +80ms.

## Mac Chrome gameplay

The real Mac Chrome tab loaded the detached production server. Ordinary Start/Replay/Restart, lane keys and settings controls were used. Machine-assisted timed inputs sampled the visible progress bar, then sent ordinary key presses; no hidden game-state injection, clock acceleration or score injection was used.

| Mode                    | Observed complete result                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| First light / Tutorial  | 10,025 points, 80%, 12-hit combo, 4 Perfect / 8 Good / 0 Miss                      |
| Solar drift / Easy      | 34,500 points, 100%, 28-hit combo, 28 Perfect / 0 Miss                             |
| Prism current / Medium  | 46,150 points, 90%, max combo 22, 38 Perfect / 3 Good / 1 Close / 3 Miss / 3 Empty |
| Midnight circuit / Hard | 101,900 points, 95%, 66-hit combo, 55 Perfect / 11 Good / 0 Miss                   |

An earlier tutorial run intentionally sent many wrong/held key presses: 2,900 points, 2 Perfect / 3 Close / 7 Miss / 50 Empty, max combo 1. This confirms hits, misses and combo resets through the actual interaction path. Pause displayed a Resume control and an 11-second countdown; the countdown remained unchanged during independent review/fix work, then resumed and completed. Restart cleared the current score and began a fresh count-in. Tutorial dialog and its Play First light button worked. Calibration through Space accepted seven separate samples and saved a bounded offset; sliders reset it to 0ms and volume to 35%, both surviving reload. Best scores for all four modes survived reload. A focused lane pad received one Enter activation then a five-second Enter hold: results were one Good, one Empty, 27 Miss, with no repeated scoring. Calibration Restart cancelled back to the track menu.

Desktop and 390×844 emulated mobile layouts were inspected via screenshots. Mobile document width and scrollWidth were both 390, with no horizontal overflow. Temporary developer viewport emulation was cleared after testing. Actual phone/touch hardware was not tested.

## Independent reviews

Using Matt Pocock's local Implement → Code Review workflow, separate standards and spec agents reviewed from the pinned documentation baseline `904ab9ada9ade4ff127c001c185a598ffce64c41`.

Standards: identified mutable public domain functions contrary to standards, keyboard pad activation missing, stale asynchronous pause UI, duplicate calibration samples. All were fixed: pure public run transitions, semantic pad input, generation-fenced async activation/resume, synchronous pause UI and unique calibration samples. Follow-up found held Enter default activation and calibration-only audio interruption detection; both corrected and source-verified by the standards reviewer, who reported no unresolved hard or lifecycle findings. Main UI module breadth remains an advisory refactoring opportunity.

Spec: identified duplicate calibration samples and a beat-length mismatch. Unique beat samples now have regression tests. Delegated final scope is explicitly 32–48 beats at increasing tempo, yielding 19–21 second scored tracks. Follow-up held Enter issue was fixed with explicit Enter/Space handling and held/repeat guards, source-verified by the spec reviewer with no unresolved spec defects.

## Limits and outstanding manual check

AudioContext activation and visual progress were verified; the soundtrack was not listened to. No acoustic quality, physical end-to-end timing, Bluetooth latency, OS audio-device switching or untested hardware claim is made. Calibration taps in automation do not establish a physical calibration value.

Native Mac window interaction reported the Mac locked. Switching/activating another tab through available browser controls did not visibly pause the run; therefore real background/OS-focus interruption remains unverified. Source handlers exist for blur, visibilitychange and stopped audio contexts, but the locked native environment did not establish a real visibility/focus transition. Manually verify tab-away and app-away auto-pause after unlocking. No security or lock settings were changed. Console warnings observed originated from the installed MetaMask extension; no game-source console error was observed.

The play process was verified parented by PID 1, independent of the task shell, serving HTTP 200 on port 5194.
