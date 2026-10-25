# Lumen Relay

An original four-button rhythm browser game inspired by ICE's **Rhythm Nation** arcade machine. Catch falling luminous orbs with **D / F / J / K** or the pointer pads. Tutorial plus three short synthesized tracks; escalating offbeats/chords, precise feedback, combo multipliers, saved best scores, calibration, pause/resume and replay. No paid services, external assets or public deployment.

## Play locally

```sh
npm ci
npm run check
npm run play
```

Open http://127.0.0.1:5194 . The launcher checks the port and starts a detached session-only production preview. It writes `play-server.log` and `.play-server.pid`, has no boot/login autostart, binds only loopback, and refuses an occupied port. It does not touch earlier game servers. After reboot or stopping this server, restart with `npm run play` from this repository (build first after source changes). `PORT=5195 npm run play` chooses a different free port.

Development: `npm run dev` (requires 5194 to be free). The existing play server serves the current `dist` build; rebuild then reload Chrome after changes.

## Rules and timing

Four opening beats count you in. Perfect ±45ms / Good ±100ms / Close ±160ms. Base scores 1000/700/300; every ten consecutive hits increases the multiplier by 0.25, capped at 2×. Misses and empty presses reset combo. Accuracy is weighted over all chart orbs, so it grows as a run progresses. Tracks always finish; missing notes does not eject you. Holding a key never repeats an input. Enter/Space activate a focused lane pad.

Audio starts on an explicit user gesture. Music scheduling, orb positions and judgements use `AudioContext.currentTime`. Pause suspends that clock. The app handles blur, tab visibility changes and a stopped audio context by pausing; resume is explicit. Calibration plays eight clicks and accepts at most one tap per click, requiring four samples. It saves a median rounded to 5ms. Positive offset subtracts from input time to compensate for late presses. A manual -200..200ms slider is available. Calibration is subjective; Bluetooth, OS, audio output and display latency vary. No claims of physically measured alignment or audio quality testing are made.

## Reference and originality

The [museum entry](https://www.arcade-museum.com/Videogame/rhythm-nation) identifies ICE's arcade game. The [original ICE sales flyer](https://flyers.arcade-museum.com/videogames/show/4743), visually inspected, confirms four buttons, dropping balls, music synchronization and three levels of difficulty. It advertises ten song choices per level. This compact adaptation supplies a tutorial and three original oscillator arrangements instead. No operator manual or footage was located; historical timing windows, scoring, failure rules and pattern details are uncertain. Our rules and charts are original. This is neither a Janet Jackson recording adaptation nor a substitution of Rhythm Heaven. No recordings, lyrics, cabinet art or original characters are copied.

## Engineering evidence

- `npm test`: nine public-domain tests for window edges, one-time scoring, combo/multiplier, misses, chart ordering/chords, corrupt persistence, calibration duplicate rejection and median offset.
- `npm run build`: strict TypeScript check and Vite production bundle.
- `npm audit --audit-level=moderate`: dependency audit.
- GitHub Actions repeats all checks on Node 24.
- Independent standards and specification reviews; findings and fixes in [QA](docs/QA.md).
- [Desktop screenshot](docs/screenshots/desktop.jpg), [mobile screenshot](docs/screenshots/mobile.jpg), [Hard results](docs/screenshots/hard-results.jpg).

See [spec](docs/spec.md), [glossary](GLOSSARY.md), and [audio clock decision](docs/adr/0001-audio-clock.md).

## Play online

[Play the hosted game](https://intrepion.github.io/kata-inspired-by-rhythm-nation-codex-dot/)
