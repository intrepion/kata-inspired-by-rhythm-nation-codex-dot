import "./style.css";
import {
  tracks,
  createRun,
  press,
  expire,
  accuracy,
  parseSave,
  type Run,
} from "./domain";
import { Sound } from "./audio";
import { acceptTap, calibratedOffset, type Tap } from "./calibration";
const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
let saved = parseSave(null);
try {
  saved = parseSave(localStorage.getItem("lumen-relay-v1"));
} catch {}
const sound = new Sound();
let selected = 1,
  run: Run = createRun(1),
  phase: "menu" | "playing" | "paused" | "results" | "calibration" = "menu",
  origin = 0,
  busy = false,
  feedbackUntil = 0;
let calibrationStart = 0,
  calibrationTaps: Tap[] = [];
let transition = 0;
const held = new Set<string>();
let storageWarning = false;
function persist() {
  try {
    localStorage.setItem("lumen-relay-v1", JSON.stringify(saved));
  } catch {
    storageWarning = true;
  }
}
$("#app").innerHTML =
  `<header><a class="brand" href="/" aria-label="Lumen Relay home"><span class="brand-icon">◈</span> LUMEN <b>RELAY</b></a><div class="edition">FOUR SIGNALS. ONE FREQUENCY.<span> ORIGINAL RHYTHM ARCADE / VOL. 01</span></div><button id="help" class="quiet">How to play</button></header><main><section class="intro"><div class="eyebrow"><span class="live-dot"></span> THE NIGHT IS YOUR INSTRUMENT</div><h1>Catch the light.<br><em>Find your rhythm.</em></h1><p>Four lanes of light. A pulse to follow.<br>Send every signal home on the beat.</p></section><div class="layout"><section class="cabinet" aria-label="Rhythm playfield"><div class="dashboard"><div><small>SCORE</small><strong id="score">000000</strong></div><div><small>COMBO</small><strong id="combo">0 <span>×</span></strong></div><div><small>ACCURACY</small><strong id="accuracy">—</strong></div><div class="status"><span class="live-dot"></span><span id="status">READY TO CONNECT</span></div></div><div class="field"><canvas id="field" aria-label="Falling orbs in four lanes; press D F J K at the target line"></canvas><div class="feedback" id="feedback"></div><div class="cover" id="cover"><div class="cover-symbol">◈</div><div class="eyebrow">SIGNAL AWAITING</div><h2 id="cover-title">The stage is yours.</h2><p id="cover-copy">Choose a track, then connect.<br>Audio starts only when you press Start.</p><button id="start" class="primary">Start track <span>↗</span></button></div><div class="track-label"><span id="track-label">SOLAR DRIFT</span><span id="remaining">100 BPM</span></div></div><div class="pads">${["D", "F", "J", "K"].map((key, i) => `<button class="pad lane-${i}" data-lane="${i}" aria-label="Lane ${i + 1}, ${key}"><span>${["◇", "○", "△", "□"][i]}</span><kbd>${key}</kbd></button>`).join("")}</div><div class="transport"><span id="hint">PRESS WHEN ORBS REACH THE RINGS</span><button id="pause" disabled>Pause</button><button id="restart" disabled>Restart</button></div><div class="progress"><div id="progress"></div></div></section><aside><div class="section-label">SELECT A FREQUENCY <span>01—03</span></div><div id="tracks">${tracks.map((t, i) => `<button class="track ${i === selected ? "selected" : ""}" data-track="${i}"><span class="track-number">${i === 0 ? "◎" : String(i).padStart(2, "0")}</span><span><small>${t.level}</small><strong>${t.name}</strong><em>${t.subtitle}</em><span class="track-meta">${t.bpm} BPM · ${Math.round((t.beats * 60) / t.bpm)} SEC <span id="best-${i}">${saved.bests[i] ? "BEST " + saved.bests[i] : "NEW SIGNAL"}</span></span></span></button>`).join("")}</div><section class="settings"><div class="section-label">TUNE YOUR CONNECTION</div><label for="volume">Volume <output id="volume-value">${Math.round(saved.volume * 100)}%</output></label><input id="volume" type="range" min="0" max="100" value="${saved.volume * 100}"><label for="offset">Timing offset <output id="offset-value">${saved.offset} ms</output></label><input id="offset" type="range" min="-200" max="200" step="5" value="${saved.offset}"><button id="calibrate" class="quiet">◎ Calibrate timing</button><p>Positive offset compensates late presses.<br>Headphones recommended. Device latency varies.</p></section><div class="legend"><span><i class="perfect"></i> PERFECT ±45ms</span><span><i class="good"></i> GOOD ±100ms</span><span><i class="close"></i> CLOSE ±160ms</span></div></aside></div><footer><span>AN ORIGINAL FOUR-BUTTON RHYTHM EXPERIENCE</span><span>NO DOWNLOADS. JUST THE PULSE. ◈</span></footer></main><dialog id="tutorial"><button id="close-help" class="quiet">Close ×</button><div class="eyebrow">QUICK CONNECTION GUIDE</div><h2>Bring the signals home.</h2><p>Press <b>D F J K</b> or tap a lane pad when its orb reaches the ring. The soundtrack and orbs share an audio clock.</p><ol><li>Start with <b>First light</b>. Four opening beats count you in.</li><li>Perfect: ±45ms. Good: ±100ms. Close: ±160ms. Early/late feedback shows your direction.</li><li>Missed orbs and empty presses break your combo. Holding a key does not repeat. Use both hands for paired orbs.</li><li>Pause or leave the window to freeze your run. Resume explicitly. Restart begins fresh.</li></ol><p>Tracks finish even with misses. Best scores save on this browser. Calibration uses eight taps; it is a subjective adjustment, not a measured hardware guarantee.</p><button id="tutorial-start" class="primary">Play First light ↗</button></dialog>`;
const canvas = $<HTMLCanvasElement>("#field"),
  ctx = canvas.getContext("2d")!;
const colors = ["#70efdc", "#ffd477", "#c4a2ff", "#ff90b9"];
function menu() {
  transition++;
  phase = "menu";
  sound.stop();
  $("#cover").hidden = false;
  $("#cover-title").textContent = "The stage is yours.";
  $("#cover-copy").innerHTML =
    "Choose a track, then connect.<br>Audio starts only when you press Start.";
  $("#start").textContent = "Start track ↗";
  $("#pause").textContent = "Pause";
  $<HTMLButtonElement>("#pause").disabled = true;
  $<HTMLButtonElement>("#restart").disabled = true;
  $("#status").textContent = "READY TO CONNECT";
  $("#hint").textContent = "PRESS WHEN ORBS REACH THE RINGS";
  $("#progress").style.width = "0%";
  updateHud();
}
function choose(index: number) {
  selected = index;
  document
    .querySelectorAll(".track")
    .forEach((el, i) => el.classList.toggle("selected", i === index));
  run = createRun(index);
  $("#track-label").textContent = tracks[index].name.toUpperCase();
  $("#remaining").textContent = `${tracks[index].bpm} BPM`;
  menu();
}
function updateHud() {
  $("#score").textContent = String(run.score).padStart(6, "0");
  $("#combo").innerHTML = `${run.combo} <span>×</span>`;
  $("#accuracy").textContent = run.orbs.some((o) => o.hit)
    ? `${accuracy(run)}%`
    : "—";
}
async function start() {
  if (busy) return;
  const version = ++transition;
  busy = true;
  try {
    sound.stop();
    await sound.activate(saved.volume);
    if (version !== transition) return;
    if (document.hidden || !document.hasFocus()) {
      menu();
      await sound.pause();
      return;
    }
    run = createRun(selected);
    origin = sound.now + 0.3;
    sound.schedule(selected, origin);
    phase = "playing";
    held.clear();
    $("#cover").hidden = true;
    $("#status").textContent = "SIGNAL LIVE";
    $("#hint").textContent =
      selected === 0
        ? "D F J K · MATCH EACH ORB TO ITS RING"
        : "PRESS WHEN ORBS REACH THE RINGS";
    $<HTMLButtonElement>("#pause").disabled = false;
    $<HTMLButtonElement>("#restart").disabled = false;
    $("#pause").textContent = "Pause";
    updateHud();
  } catch (e) {
    $("#cover-copy").textContent = String(e);
  } finally {
    busy = false;
  }
}
async function pause(reason = "Paused — take a breath.") {
  if (phase !== "playing" && phase !== "calibration") return;
  ++transition;
  const wasCalibration = phase === "calibration";
  phase = "paused";
  held.clear();
  $("#cover").hidden = false;
  $("#cover-title").textContent = wasCalibration
    ? "Calibration interrupted"
    : "Signal on hold.";
  $("#cover-copy").textContent = wasCalibration
    ? "Start calibration again when ready."
    : reason;
  $("#start").textContent = wasCalibration
    ? "Back to tracks"
    : "Resume track ↗";
  $("#pause").textContent = "Resume";
  $("#status").textContent = "PAUSED";
  if (wasCalibration) {
    sound.stop();
    menu();
    $("#cover-title").textContent = "Calibration interrupted";
    $("#cover-copy").textContent = "Start calibration again when ready.";
  }
  await sound.pause();
}
async function resume() {
  if (busy) return;
  const version = ++transition;
  busy = true;
  try {
    await sound.resume();
    if (version !== transition) return;
    if (document.hidden || !document.hasFocus()) {
      await sound.pause();
      return;
    }
    phase = "playing";
    $("#cover").hidden = true;
    $("#pause").textContent = "Pause";
    $("#status").textContent = "SIGNAL LIVE";
  } catch (e) {
    $("#cover-copy").textContent = String(e);
  } finally {
    busy = false;
  }
}
function finish() {
  phase = "results";
  sound.stop();
  const acc = accuracy(run),
    newBest = run.score > saved.bests[selected];
  if (newBest) {
    saved.bests[selected] = run.score;
    persist();
    $(`#best-${selected}`).textContent = `BEST ${run.score}`;
  }
  $("#cover").hidden = false;
  $("#cover-title").textContent =
    acc >= 90
      ? "Beautiful connection."
      : acc >= 60
        ? "You found the pulse."
        : "Every signal is a new start.";
  $("#cover-copy").innerHTML =
    `<b>${run.score.toLocaleString()} POINTS · ${acc}% ACCURACY</b><br>${run.counts.Perfect} Perfect · ${run.counts.Good} Good · ${run.counts.Close} Close<br>${run.counts.Miss} Miss · ${run.strays} Empty · Best combo ${run.maxCombo}<br>${newBest ? "NEW PERSONAL BEST" : ""}${storageWarning ? " · Storage unavailable" : ""}`;
  $("#start").textContent = "Replay track ↗";
  $<HTMLButtonElement>("#pause").disabled = true;
  $("#status").textContent = "TRACK COMPLETE";
  $("#hint").textContent = "TRY ANOTHER FREQUENCY OR REPLAY";
  updateHud();
}
function input(lane: number) {
  if (phase === "calibration") {
    calibrationTap();
    return;
  }
  if (phase !== "playing") return;
  const elapsed = sound.now - origin - saved.offset / 1000;
  if (elapsed < 0) return;
  const outcome = press(run, lane, elapsed);
  run = outcome.run;
  const { result, delta } = outcome;
  $("#feedback").textContent =
    result === "Empty"
      ? "EMPTY · find the pulse"
      : `${result.toUpperCase()}${result === "Perfect" ? "" : delta < 0 ? " · EARLY" : " · LATE"}`;
  $("#feedback").style.color = result === "Empty" ? "#ff90b9" : colors[lane];
  feedbackUntil = sound.now + 0.55;
  const pad = $(`[data-lane="${lane}"]`);
  pad.classList.add("lit");
  setTimeout(() => pad.classList.remove("lit"), 120);
  updateHud();
}
async function calibrate() {
  if (busy) return;
  const version = ++transition;
  busy = true;
  try {
    sound.stop();
    await sound.activate(saved.volume);
    if (version !== transition) return;
    if (document.hidden || !document.hasFocus()) {
      menu();
      await sound.pause();
      return;
    }
    phase = "calibration";
    calibrationTaps = [];
    calibrationStart = sound.now + 1;
    for (let i = 0; i < 8; i++)
      sound.tone(calibrationStart + i * 0.6, 880, 0.09, "sine", 0.8);
    $("#cover").hidden = false;
    $("#cover-title").textContent = "Tap to the pulse.";
    $("#cover-copy").textContent =
      "Listen for eight clicks. Tap Space or the button on each click. First click in one second.";
    $("#start").textContent = "Tap / Space (0 of 8)";
    $("#status").textContent = "CALIBRATING";
    $<HTMLButtonElement>("#pause").disabled = true;
    $<HTMLButtonElement>("#restart").disabled = false;
  } catch (e) {
    $("#cover-copy").textContent = String(e);
  } finally {
    busy = false;
  }
}
function calibrationTap() {
  calibrationTaps = acceptTap(calibrationTaps, sound.now - calibrationStart);
  $("#start").textContent = `Tap / Space (${calibrationTaps.length} of 8)`;
  if (calibrationTaps.length === 8) completeCalibration();
}
function completeCalibration() {
  sound.stop();
  const offset = calibratedOffset(calibrationTaps);
  if (offset !== null) {
    saved.offset = offset;
    persist();
    $<HTMLInputElement>("#offset").value = String(saved.offset);
    $("#offset-value").textContent = `${saved.offset} ms`;
    menu();
    $("#cover-title").textContent = "Connection tuned.";
    $("#cover-copy").textContent =
      `${calibrationTaps.length} taps · offset ${saved.offset} ms. Replay calibration if it feels wrong.`;
  } else {
    menu();
    $("#cover-title").textContent = "Try calibration again.";
    $("#cover-copy").textContent =
      "At least four taps are needed. Use Space on each audible click.";
  }
}
$("#start").onclick = () => {
  if (phase === "calibration") calibrationTap();
  else if (phase === "paused") void resume();
  else void start();
};
$("#pause").onclick = () => (phase === "paused" ? void resume() : void pause());
$("#restart").onclick = () => {
  if (busy) return;
  sound.stop();
  if (phase === "calibration") {
    menu();
    return;
  }
  void start();
};
$("#calibrate").onclick = () => void calibrate();
document
  .querySelectorAll<HTMLElement>("[data-track]")
  .forEach((el) => (el.onclick = () => choose(Number(el.dataset.track))));
const dialog = $<HTMLDialogElement>("#tutorial");
$("#help").onclick = () => {
  void pause("Help opened. Resume when ready.");
  dialog.showModal();
};
$("#close-help").onclick = () => dialog.close();
$("#tutorial-start").onclick = () => {
  dialog.close();
  choose(0);
  void start();
};
$("#volume").oninput = () => {
  saved.volume = Number($<HTMLInputElement>("#volume").value) / 100;
  sound.setVolume(saved.volume);
  $("#volume-value").textContent = `${Math.round(saved.volume * 100)}%`;
  persist();
};
$("#offset").oninput = () => {
  saved.offset = Number($<HTMLInputElement>("#offset").value);
  $("#offset-value").textContent = `${saved.offset} ms`;
  persist();
};
document.querySelectorAll<HTMLElement>("[data-lane]").forEach((el) => {
  el.onclick = (e) => {
    if (e.detail === 0 && !dialog.open) input(Number(el.dataset.lane));
  };
  el.onpointerdown = (e) => {
    e.preventDefault();
    if (!dialog.open) input(Number(el.dataset.lane));
  };
});
window.addEventListener("keydown", (e) => {
  const pad = (e.target as HTMLElement).closest<HTMLElement>("[data-lane]");
  if (!dialog.open && pad && (e.code === "Enter" || e.code === "Space")) {
    e.preventDefault();
    if (!e.repeat && !held.has(e.code)) {
      held.add(e.code);
      input(Number(pad.dataset.lane));
    }
    return;
  }
  if (
    dialog.open ||
    (/INPUT|BUTTON/.test((e.target as HTMLElement).tagName) &&
      e.code === "Space")
  )
    return;
  const lane = ["KeyD", "KeyF", "KeyJ", "KeyK"].indexOf(e.code);
  if (lane >= 0 || e.code === "Space" || e.code === "Escape")
    e.preventDefault();
  if (e.repeat || held.has(e.code)) return;
  held.add(e.code);
  if (lane >= 0) input(lane);
  else if (e.code === "Space" && phase === "calibration") calibrationTap();
  else if (e.code === "Escape")
    phase === "paused" ? void resume() : void pause();
});
window.addEventListener("keyup", (e) => held.delete(e.code));
window.addEventListener(
  "blur",
  () => void pause("Window focus lost. Resume when ready."),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) void pause("Tab hidden. Resume when ready.");
});
function draw() {
  const box = canvas.getBoundingClientRect(),
    dpr = Math.min(2, devicePixelRatio);
  if (
    canvas.width !== Math.round(box.width * dpr) ||
    canvas.height !== Math.round(box.height * dpr)
  ) {
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = box.width,
    h = box.height,
    laneWidth = w / 4,
    target = h - 56,
    time = sound.now - origin;
  ctx.clearRect(0, 0, w, h);
  for (let lane = 0; lane < 4; lane++) {
    const x = laneWidth * (lane + 0.5);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#0b122400");
    gradient.addColorStop(1, colors[lane] + "16");
    ctx.fillStyle = gradient;
    ctx.fillRect(lane * laneWidth, 0, laneWidth, h);
    ctx.strokeStyle = "#ffffff0e";
    ctx.beginPath();
    ctx.moveTo(lane * laneWidth, 0);
    ctx.lineTo(lane * laneWidth, h);
    ctx.stroke();
    ctx.strokeStyle = colors[lane];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, target, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = colors[lane] + "18";
    ctx.fill();
    ctx.fillStyle = "#ffffff50";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(lane + 1).padStart(2, "0"), x, 25);
  }
  ctx.strokeStyle = "#ffffff35";
  ctx.setLineDash([3, 7]);
  ctx.beginPath();
  ctx.moveTo(0, target);
  ctx.lineTo(w, target);
  ctx.stroke();
  ctx.setLineDash([]);
  if (phase === "playing" || phase === "paused") {
    for (const o of run.orbs) {
      if (o.hit) continue;
      const y = target - (o.time - time) * 150;
      if (y < 35 || y > h) continue;
      const x = laneWidth * (o.lane + 0.5),
        c = colors[o.lane];
      ctx.shadowBlur = 20;
      ctx.shadowColor = c;
      const grad = ctx.createRadialGradient(x - 5, y - 6, 1, x, y, 15);
      grad.addColorStop(0, "#fff");
      grad.addColorStop(0.3, c);
      grad.addColorStop(1, c + "60");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = c;
      ctx.stroke();
    }
    if (phase === "playing") {
      run = expire(run, time - saved.offset / 1000);
      updateHud();
      const duration = (tracks[selected].beats * 60) / tracks[selected].bpm;
      $("#progress").style.width =
        `${Math.max(0, Math.min(100, (time / duration) * 100))}%`;
      $("#remaining").textContent =
        time < (4 * 60) / tracks[selected].bpm
          ? `COUNT IN ${Math.max(1, 4 - Math.floor((Math.max(0, time) * tracks[selected].bpm) / 60))}`
          : `${Math.max(0, Math.ceil(duration - time))} SEC`;
      if (time > duration + 0.3 + Math.max(0, saved.offset / 1000)) finish();
      if (sound.context?.state !== "running")
        void pause("Audio was interrupted. Resume when ready.");
    }
  }
  if (sound.now > feedbackUntil) $("#feedback").textContent = "";
  if (phase === "calibration" && sound.context?.state !== "running")
    void pause("Calibration audio interrupted.");
  if (phase === "calibration" && sound.now > calibrationStart + 4.8)
    completeCalibration();
  requestAnimationFrame(draw);
}
choose(1);
draw();
