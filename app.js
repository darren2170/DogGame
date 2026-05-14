const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const setupScreen = document.querySelector("#setup-screen");
const dogNameInput = document.querySelector("#dog-name");
const dogPhotoInput = document.querySelector("#dog-photo");
const dogPreview = document.querySelector("#dog-preview");
const houseNameInputs = Array.from(document.querySelectorAll(".house-name-input"));
const saveSetupBtn = document.querySelector("#save-setup");
const defaultSetupBtn = document.querySelector("#default-setup");
const dogLabel = document.querySelector("#dog-label");
const levelEl = document.querySelector("#level");
const stageEl = document.querySelector("#stage");
const scoreEl = document.querySelector("#score");
const timeEl = document.querySelector("#time");
const statusEl = document.querySelector("#status");
const restartBtn = document.querySelector("#restart");
const tryAgainBtn = document.querySelector("#try-again");
const setupBtn = document.querySelector("#setup-button");
const songBtn = document.querySelector("#song");
const dropBtn = document.querySelector("#drop");
const holdBtns = document.querySelectorAll("[data-hold]");

const defaultDogName = "Ziggy";
const defaultDogSrc = "assets/Z20.jpg";
const defaultHouseNames = ["Wese's House", "Alan's House", "Surby's House", "Black's House", "House 5"];
const storage = (() => {
  try {
    const key = "yardDashStorageTest";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return window.localStorage;
  } catch {
    return null;
  }
})();
const storageGet = (key, fallback) => {
  try {
    return storage ? storage.getItem(key) || fallback : fallback;
  } catch {
    return fallback;
  }
};
const storageSet = (key, value) => {
  try {
    if (storage) storage.setItem(key, value);
  } catch {
    // The game still works if the browser refuses to persist a large photo.
  }
};
const storageRemove = (key) => {
  try {
    if (storage) storage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
};
let dogName = storageGet("yardDashDogName", defaultDogName);
let selectedDogSrc = storageGet("yardDashDogPhoto", defaultDogSrc);
let houseNames = (() => {
  try {
    const saved = storageGet("yardDashHouseNames", "");
    const parsed = saved ? JSON.parse(saved) : defaultHouseNames;
    return defaultHouseNames.map((name, index) => cleanHouseName(parsed[index], name));
  } catch {
    return [...defaultHouseNames];
  }
})();
const dogImg = new Image();
dogImg.src = selectedDogSrc;

const keys = new Set();
const heldDirections = new Set();
const levels = [
  {
    name: "Morning Mischief",
    targets: 3,
    time: 56,
    neighborSpeed: 96,
    chaseSpeed: 176,
    chaseTime: 3.6,
    yardScale: 1,
    env: {
      skyTop: "#9fd3ff",
      skyBottom: "#d9f1ff",
      grass: "#78b95e",
      grassAlt: "#65845a",
      sidewalk: "#d9d0bb",
      road: "#5f6468",
      lane: "#f5d667",
      overlay: "rgba(255, 255, 255, 0)",
      effect: "birds",
    },
  },
  {
    name: "Block Party",
    targets: 4,
    time: 52,
    neighborSpeed: 112,
    chaseSpeed: 210,
    chaseTime: 4.1,
    yardScale: 0.84,
    env: {
      skyTop: "#86c7ff",
      skyBottom: "#f7f1c6",
      grass: "#70aa55",
      grassAlt: "#557c45",
      sidewalk: "#dfd5c4",
      road: "#555e64",
      lane: "#ffe27a",
      overlay: "rgba(255, 214, 102, 0.08)",
      effect: "balloons",
    },
  },
  {
    name: "Sunset Sprint",
    targets: 5,
    time: 48,
    neighborSpeed: 128,
    chaseSpeed: 238,
    chaseTime: 4.8,
    yardScale: 0.72,
    env: {
      skyTop: "#f39b6d",
      skyBottom: "#ffd6a5",
      grass: "#679f55",
      grassAlt: "#4d7740",
      sidewalk: "#d4bfa6",
      road: "#56515a",
      lane: "#ffd166",
      overlay: "rgba(239, 71, 111, 0.1)",
      effect: "sunset",
    },
  },
  {
    name: "Night Patrol",
    targets: 5,
    time: 44,
    neighborSpeed: 142,
    chaseSpeed: 264,
    chaseTime: 5.1,
    yardScale: 0.64,
    env: {
      skyTop: "#17213c",
      skyBottom: "#35456f",
      grass: "#4c7b4d",
      grassAlt: "#345c39",
      sidewalk: "#a8a79f",
      road: "#343942",
      lane: "#f3d36b",
      overlay: "rgba(23, 33, 60, 0.22)",
      effect: "stars",
    },
  },
  {
    name: "Storm Run",
    targets: 5,
    time: 40,
    neighborSpeed: 156,
    chaseSpeed: 286,
    chaseTime: 5.4,
    yardScale: 0.58,
    env: {
      skyTop: "#4b596b",
      skyBottom: "#8fa0a8",
      grass: "#4f854c",
      grassAlt: "#365f38",
      sidewalk: "#b9b5aa",
      road: "#3f454d",
      lane: "#f0d36a",
      overlay: "rgba(73, 93, 110, 0.18)",
      effect: "rain",
    },
  },
  {
    name: "Hood Legend",
    targets: 5,
    time: 36,
    neighborSpeed: 172,
    chaseSpeed: 318,
    chaseTime: 5.9,
    yardScale: 0.52,
    env: {
      skyTop: "#241f47",
      skyBottom: "#513b7a",
      grass: "#426f43",
      grassAlt: "#2f5132",
      sidewalk: "#c2b6d2",
      road: "#2e2b39",
      lane: "#9be7ff",
      overlay: "rgba(155, 231, 255, 0.12)",
      effect: "neon",
    },
  },
];
let currentLevel = 0;
let lastTime = 0;
let game;
let introActive = true;
let setupActive = true;
let audioCtx;
let audioReady = false;
let introSongPlayed = false;
let introSpeechPlayed = false;
let introMelodyPlayed = false;
let victorySongPlayed = false;
let victorySpeechPlayed = false;
let victoryMelodyPlayed = false;
const activeUtterances = [];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function cleanDogName(value) {
  const name = value.trim();
  return name || defaultDogName;
}

function cleanHouseName(value, fallback) {
  const name = String(value || "").trim();
  return name || fallback;
}

function possessiveName() {
  return dogName.endsWith("s") ? `${dogName}'` : `${dogName}'s`;
}

function applyDogIdentity() {
  dogNameInput.value = dogName;
  dogPreview.src = selectedDogSrc;
  dogImg.src = selectedDogSrc;
  dogLabel.textContent = dogName;
  houseNameInputs.forEach((input, index) => {
    input.value = houseNames[index] || defaultHouseNames[index];
  });
  document.title = `${dogName} Poops the Hood`;
}

function openSetup() {
  setupActive = true;
  if (game) {
    game.running = false;
  }
  setupScreen.classList.remove("hidden");
}

function closeSetup() {
  setupActive = false;
  setupScreen.classList.add("hidden");
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
  canvas.focus();
  showIntro();
}

function saveDogSetup() {
  dogName = cleanDogName(dogNameInput.value);
  houseNames = houseNameInputs.map((input, index) => cleanHouseName(input.value, defaultHouseNames[index]));
  storageSet("yardDashDogName", dogName);
  storageSet("yardDashDogPhoto", selectedDogSrc);
  storageSet("yardDashHouseNames", JSON.stringify(houseNames));
  applyDogIdentity();
  closeSetup();
}

function useDefaultDog() {
  dogName = defaultDogName;
  selectedDogSrc = defaultDogSrc;
  dogImg.src = selectedDogSrc;
  dogNameInput.value = dogName;
  dogPreview.src = defaultDogSrc;
  houseNames = [...defaultHouseNames];
  storageRemove("yardDashDogName");
  storageRemove("yardDashDogPhoto");
  storageRemove("yardDashHouseNames");
  applyDogIdentity();
  closeSetup();
}

function resizeDogPhoto(file, done) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const img = new Image();
    img.addEventListener("load", () => {
      const size = 320;
      const canvasEl = document.createElement("canvas");
      const canvasCtx = canvasEl.getContext("2d");
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      canvasEl.width = size;
      canvasEl.height = size;
      canvasCtx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      done(canvasEl.toDataURL("image/jpeg", 0.82));
    });
    img.addEventListener("error", () => done(reader.result));
    img.src = reader.result;
  });
  reader.readAsDataURL(file);
}

function poly(points, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function makeGame(levelIndex = currentLevel) {
  const level = levels[levelIndex];
  const houses = [
    { x: 58, y: 52, w: 138, h: 82, wall: "#f7d18b", roof: "#b04f35" },
    { x: 238, y: 48, w: 138, h: 86, wall: "#d5e8f2", roof: "#315f7d" },
    { x: 420, y: 50, w: 138, h: 84, wall: "#f0c1b0", roof: "#814e7a" },
    { x: 604, y: 48, w: 138, h: 86, wall: "#f8e8a8", roof: "#5e7d4f" },
    { x: 784, y: 52, w: 132, h: 82, wall: "#e2d5f7", roof: "#6f4c8b" },
  ];

  return {
    running: true,
    won: false,
    caught: false,
    timedOut: false,
    levelComplete: false,
    levelIndex,
    level,
    targetCount: level.targets,
    time: level.time,
    score: 0,
    elapsed: 0,
    dog: {
      x: 90,
      y: canvas.height - 88,
      r: 26,
      speed: 255,
      facing: 1,
      cooldown: 0,
      moving: false,
      stride: 0,
      stepTimer: 0,
    },
    neighbor: {
      x: canvas.width - 88,
      y: 118,
      r: 25,
      speed: level.neighborSpeed,
      chaseSpeed: level.chaseSpeed,
      alert: 0,
      stride: 0,
    },
    houses,
    poops: [],
    yards: houses.slice(0, level.targets).map((house, i) => {
      const baseW = house.w - 16;
      const baseH = 94;
      const w = baseW * level.yardScale;
      const h = baseH * level.yardScale;
      const x = house.x + 8 + (baseW - w) / 2;
      const y = 170 + (i % 2) * 125 + (baseH - h) / 2;
      return {
        x,
        y,
        id: i,
        w,
        h,
        gateX: house.x + house.w / 2,
        bobPhase: i * 1.35,
        bobAmount: 8 + i * 1.5,
        apology: "",
        done: false,
      };
    }),
    lawnLines: Array.from({ length: 18 }, (_, i) => ({
      x: -60 + i * 68,
      y: 170 + (i % 5) * 70,
    })),
  };
}

function restart() {
  currentLevel = 0;
  game = makeGame(currentLevel);
  introActive = false;
  victorySongPlayed = false;
  victorySpeechPlayed = false;
  victoryMelodyPlayed = false;
  lastTime = performance.now();
  updateHud();
}

function tryAgain() {
  game = makeGame(currentLevel);
  introActive = false;
  victorySongPlayed = false;
  victorySpeechPlayed = false;
  victoryMelodyPlayed = false;
  lastTime = performance.now();
  updateHud();
}

function showIntro() {
  if (setupActive) return;
  currentLevel = 0;
  game = makeGame(currentLevel);
  game.running = false;
  introActive = true;
  introSongPlayed = false;
  introSpeechPlayed = false;
  introMelodyPlayed = false;
  lastTime = performance.now();
  updateHud();
  window.setTimeout(() => singIntro({ retryAudio: false }), 450);
}

function startGame() {
  if (setupActive || !introActive) return;
  ensureAudio();
  canvas.focus();
  currentLevel = 0;
  game = makeGame(currentLevel);
  introActive = false;
  introSongPlayed = true;
  victorySongPlayed = false;
  victorySpeechPlayed = false;
  victoryMelodyPlayed = false;
  lastTime = performance.now();
  updateHud();
}

function nextLevel() {
  if (!game.levelComplete) return;
  canvas.focus();
  currentLevel = Math.min(currentLevel + 1, levels.length - 1);
  game = makeGame(currentLevel);
  victorySongPlayed = false;
  victorySpeechPlayed = false;
  victoryMelodyPlayed = false;
  lastTime = performance.now();
  updateHud();
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(() => {
      audioReady = true;
    });
  } else {
    audioReady = true;
  }
}

function playFart() {
  ensureAudio();
  if (!audioReady) {
    window.setTimeout(playFart, 80);
    return;
  }
  const now = audioCtx.currentTime;
  const duration = 0.7;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const t = i / audioCtx.sampleRate;
    const wobble = Math.sin(t * 38) * 0.62 + Math.sin(t * 73) * 0.28 + Math.sin(t * 119) * 0.14;
    const envelope = Math.sin((i / bufferSize) * Math.PI);
    data[i] = (Math.random() * 2 - 1 + wobble) * envelope * 0.55;
  }

  const source = audioCtx.createBufferSource();
  const tone = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  const toneGain = audioCtx.createGain();

  source.buffer = buffer;
  source.playbackRate.setValueAtTime(0.82, now);
  source.playbackRate.exponentialRampToValueAtTime(0.32, now + duration);
  tone.type = "sawtooth";
  tone.frequency.setValueAtTime(96, now);
  tone.frequency.exponentialRampToValueAtTime(42, now + duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420, now);
  filter.frequency.exponentialRampToValueAtTime(86, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.78, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  tone.connect(toneGain);
  toneGain.connect(audioCtx.destination);
  source.start(now);
  tone.start(now);
  source.stop(now + duration);
  tone.stop(now + duration);
}

function playStep() {
  ensureAudio();
  if (!audioReady || !game.running || introActive) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const click = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const clickGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(96 + Math.random() * 18, now);
  osc.frequency.exponentialRampToValueAtTime(54, now + 0.08);
  click.type = "square";
  click.frequency.setValueAtTime(180 + Math.random() * 30, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(520, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.045, now + 0.006);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  click.connect(clickGain);
  clickGain.connect(audioCtx.destination);
  osc.start(now);
  click.start(now);
  osc.stop(now + 0.1);
  click.stop(now + 0.04);
}

function pickIntroVoice() {
  if (!("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => /female|woman|zira|samantha|jenny|aria|natural/i.test(voice.name)) ||
    voices.find((voice) => /en-/i.test(voice.lang)) ||
    voices[0]
  );
}

function speakLine(text, pitch, rate) {
  if (!("speechSynthesis" in window)) return;
  const voice = pickIntroVoice();
  const line = new SpeechSynthesisUtterance(text);
  if (voice) line.voice = voice;
  line.pitch = pitch;
  line.rate = rate;
  line.volume = 1;
  activeUtterances.push(line);
  line.onend = () => {
    const index = activeUtterances.indexOf(line);
    if (index >= 0) activeUtterances.splice(index, 1);
  };
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(line);
}

function singIntro(options = {}) {
  ensureAudio();
  introSongPlayed = true;

  if ("speechSynthesis" in window && !introSpeechPlayed) {
    introSpeechPlayed = true;
    window.speechSynthesis.cancel();
    const voice = pickIntroVoice();
    const chant = [
      [`${dogName}! ${dogName}!`, 2.0, 1.75],
      ["He's the pooping neighborhood dog!", 1.85, 1.72],
      ["Can you get him?", 2.0, 1.8],
    ];

    for (const [text, pitch, rate] of chant) {
      speakLine(text, pitch, rate);
    }
  }

  if (!audioReady) {
    if (options.retryAudio) {
      window.setTimeout(() => singIntro({ retryAudio: true }), 100);
    }
    return;
  }

  if (introMelodyPlayed) return;
  introMelodyPlayed = true;

  const now = audioCtx.currentTime + 0.04;
  const melody = [
    [392, 0.18],
    [494, 0.18],
    [587, 0.28],
    [587, 0.14],
    [659, 0.22],
    [587, 0.2],
    [523, 0.18],
    [494, 0.28],
    [440, 0.16],
    [494, 0.16],
    [523, 0.22],
    [587, 0.18],
    [659, 0.34],
    [784, 0.42],
  ];

  let cursor = now;
  for (const [freq, length] of melody) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, cursor);
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(5.8, cursor);
    vibratoGain.gain.setValueAtTime(8, cursor);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.exponentialRampToValueAtTime(0.28, cursor + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + length);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(cursor);
    vibrato.start(cursor);
    osc.stop(cursor + length + 0.02);
    vibrato.stop(cursor + length + 0.02);
    cursor += length * 0.92;
  }
}

function singVictory() {
  if (victorySongPlayed && victorySpeechPlayed && victoryMelodyPlayed) return;
  victorySongPlayed = true;
  ensureAudio();

  if ("speechSynthesis" in window && !victorySpeechPlayed) {
    victorySpeechPlayed = true;
    window.speechSynthesis.cancel();
    window.setTimeout(() => {
      speakLine(`${dogName} pooped the hood!`, 2.0, 1.45);
    }, 120);
  }

  if (!audioReady) {
    window.setTimeout(singVictory, 100);
    return;
  }

  if (victoryMelodyPlayed) return;
  victoryMelodyPlayed = true;

  const now = audioCtx.currentTime + 0.03;
  const melody = [
    [523, 0.16],
    [659, 0.16],
    [784, 0.22],
    [880, 0.2],
    [784, 0.16],
    [1046, 0.42],
  ];
  let cursor = now;
  for (const [freq, length] of melody) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, cursor);
    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.exponentialRampToValueAtTime(0.3, cursor + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + length);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(cursor);
    osc.stop(cursor + length + 0.03);
    cursor += length * 0.9;
  }
}

function speakDogMan(text) {
  ensureAudio();
  if ("speechSynthesis" in window) {
    window.setTimeout(() => {
      speakLine(text, 0.18, 0.58);
    }, 120);
  }
  if (!audioReady) return;

  const now = audioCtx.currentTime + 0.08;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(82, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.5);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(240, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.52);
}

function updateHud() {
  levelEl.textContent = game.levelIndex + 1;
  stageEl.textContent = game.level.name;
  scoreEl.textContent = `${game.score}/${game.targetCount}`;
  timeEl.textContent = Math.max(0, Math.ceil(game.time));
  statusEl.textContent = introActive
    ? "Ready"
    : game.levelComplete
      ? "Next"
    : game.caught
    ? "Caught"
    : game.won
      ? "Legend"
      : game.neighbor.alert > 0
        ? "Chased"
        : game.dog.moving
          ? "Running"
          : "Sneaky";
}

function currentYard() {
  return game.yards.find(
    (yard) => {
      return !yard.done && backPawsInYard(yard);
    },
  );
}

function yardBob(yard) {
  return Math.sin(game.elapsed * 1.6 + yard.bobPhase) * yard.bobAmount;
}

function yardDropBounds(yard) {
  const y = yard.y + yardBob(yard);
  return {
    left: yard.x - 18,
    right: yard.x + yard.w + 18,
    top: y - 28,
    bottom: y + yard.h + 36,
  };
}

function yardVisualBounds(yard) {
  const y = yard.y + yardBob(yard);
  return {
    left: yard.x,
    right: yard.x + yard.w,
    top: y,
    bottom: y + yard.h,
    y,
  };
}

function poopSpotForYard(yard) {
  const bounds = yardVisualBounds(yard);
  return {
    x: clamp(game.dog.x - game.dog.facing * 30, bounds.left + 18, bounds.right - 18),
    y: clamp(game.dog.y + 22, bounds.top + 18, bounds.bottom - 18),
  };
}

function dogFullyInYard(yard) {
  const bounds = yardDropBounds(yard);
  const dog = game.dog;
  const left = dog.facing > 0 ? dog.x - 58 : dog.x - 82;
  const right = dog.facing > 0 ? dog.x + 82 : dog.x + 58;
  const top = dog.y - 55;
  const bottom = dog.y + 50;

  return left > bounds.left && right < bounds.right && top > bounds.top && bottom < bounds.bottom;
}

function backPawsInYard(yard) {
  const bounds = yardVisualBounds(yard);
  const dog = game.dog;
  const pawY = dog.y + 47;
  const backPaws = [
    { x: dog.x - dog.facing * 42, y: pawY },
    { x: dog.x - dog.facing * 18, y: pawY },
  ];

  return backPaws.every(
    (paw) =>
      paw.x > bounds.left &&
      paw.x < bounds.right &&
      paw.y > bounds.top &&
      paw.y < bounds.bottom,
  );
}

function dropPoop() {
  if (!game.running || game.dog.cooldown > 0) return;
  const yard = currentYard();
  if (!yard) return;

  yard.done = true;
  game.score += 1;
  const poopSpot = poopSpotForYard(yard);
  const yardBounds = yardVisualBounds(yard);
  game.poops.push({
    yardId: yard.id,
    localX: poopSpot.x - yard.x,
    localY: poopSpot.y - yardBounds.y,
    r: 10,
    pulse: 0,
  });
  playFart();
  if (yard.apology) {
    speakDogMan(yard.apology);
  }
  game.dog.cooldown = 0.65;
  game.neighbor.alert = game.level.chaseTime;

  if (game.score === game.targetCount) {
    game.running = false;
    if (game.levelIndex === levels.length - 1) {
      game.won = true;
      window.setTimeout(singVictory, 160);
    } else {
      game.levelComplete = true;
    }
  }
  updateHud();
}

function updateDog(dt) {
  const dog = game.dog;
  const xAxis =
    (keys.has("ArrowRight") || heldDirections.has("right") ? 1 : 0) -
    (keys.has("ArrowLeft") || heldDirections.has("left") ? 1 : 0);
  const yAxis =
    (keys.has("ArrowDown") || heldDirections.has("down") ? 1 : 0) -
    (keys.has("ArrowUp") || heldDirections.has("up") ? 1 : 0);
  const length = Math.hypot(xAxis, yAxis) || 1;

  dog.moving = xAxis !== 0 || yAxis !== 0;
  dog.x = clamp(dog.x + (xAxis / length) * dog.speed * dt, dog.r + 18, canvas.width - dog.r - 18);
  dog.y = clamp(dog.y + (yAxis / length) * dog.speed * dt, 178, canvas.height - 65);
  if (xAxis !== 0) dog.facing = Math.sign(xAxis);
  dog.cooldown = Math.max(0, dog.cooldown - dt);
  dog.stride += (dog.moving ? 13 : 3.5) * dt;
  if (dog.moving) {
    dog.stepTimer -= dt;
    if (dog.stepTimer <= 0) {
      playStep();
      dog.stepTimer = 0.18;
    }
  } else {
    dog.stepTimer = 0;
  }
}

function keyAction(event) {
  const byCode = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right",
    Space: "drop",
    Enter: "enter",
  };
  if (byCode[event.code]) return byCode[event.code];

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const byKey = {
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    " ": "drop",
    Enter: "enter",
  };
  return byKey[key] || key;
}

function directionKey(action) {
  return {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
  }[action];
}

function isTypingField(target) {
  return (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  );
}

function updateNeighbor(dt) {
  const neighbor = game.neighbor;
  neighbor.alert = Math.max(0, neighbor.alert - dt);

  const target = neighbor.alert > 0 ? game.dog : { x: canvas.width - 88, y: 118 };
  const dx = target.x - neighbor.x;
  const dy = target.y - neighbor.y;
  const length = Math.hypot(dx, dy) || 1;
  const speed = neighbor.alert > 0 ? neighbor.chaseSpeed : neighbor.speed;

  neighbor.x += (dx / length) * speed * dt;
  neighbor.y += (dy / length) * speed * dt;
  neighbor.stride += (neighbor.alert > 0 ? 16 : 6) * dt;

  if (dist(neighbor, game.dog) < neighbor.r + game.dog.r - 2) {
    game.running = false;
    game.caught = true;
    updateHud();
  }
}

function updateWorld(dt) {
  game.elapsed += dt;
  for (const poop of game.poops) {
    poop.pulse += dt;
  }
}

function drawSkyAndStreet() {
  const env = game.level.env;
  const sky = ctx.createLinearGradient(0, 0, 0, 185);
  sky.addColorStop(0, env.skyTop);
  sky.addColorStop(1, env.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, 185);

  ctx.fillStyle = env.grass;
  ctx.fillRect(0, 135, canvas.width, canvas.height - 135);

  const glow = ctx.createRadialGradient(canvas.width * 0.5, 310, 80, canvas.width * 0.5, 310, 540);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 135, canvas.width, canvas.height - 135);

  ctx.fillStyle = env.grassAlt;
  for (const line of game.lawnLines) {
    ctx.globalAlpha = 0.25;
    ctx.fillRect(line.x, line.y, 42, 4);
  }
  ctx.globalAlpha = 1;

  poly(
    [
      { x: 0, y: canvas.height - 136 },
      { x: canvas.width, y: canvas.height - 136 },
      { x: canvas.width, y: canvas.height - 92 },
      { x: 0, y: canvas.height - 104 },
    ],
    env.sidewalk,
  );
  poly(
    [
      { x: 0, y: canvas.height - 104 },
      { x: canvas.width, y: canvas.height - 92 },
      { x: canvas.width, y: canvas.height },
      { x: 0, y: canvas.height },
    ],
    env.road,
  );
  ctx.fillStyle = env.lane;
  for (let x = 18; x < canvas.width; x += 96) {
    ctx.fillRect(x, canvas.height - 48 + Math.sin(x) * 3, 48, 6);
  }

  drawEnvironmentEffect(env);
}

function drawEnvironmentEffect(env) {
  if (env.effect === "birds") {
    ctx.strokeStyle = "rgba(36, 54, 37, 0.45)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const x = 120 + i * 82;
      const y = 46 + i * 14;
      ctx.beginPath();
      ctx.arc(x, y, 9, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(x + 18, y, 9, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }

  if (env.effect === "balloons") {
    const colors = ["#ef476f", "#ffd166", "#2a9d8f"];
    for (let i = 0; i < 3; i += 1) {
      const x = 690 + i * 34;
      const y = 52 + Math.sin(game.elapsed * 2 + i) * 5;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(36, 54, 37, 0.45)";
      ctx.beginPath();
      ctx.moveTo(x, y + 16);
      ctx.lineTo(x - 5, y + 54);
      ctx.stroke();
    }
  }

  if (env.effect === "sunset") {
    ctx.fillStyle = "rgba(255, 209, 102, 0.75)";
    ctx.beginPath();
    ctx.arc(820, 76, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  if (env.effect === "stars" || env.effect === "neon") {
    ctx.fillStyle = env.effect === "neon" ? "#9be7ff" : "#ffffff";
    for (let i = 0; i < 24; i += 1) {
      const x = 35 + ((i * 83) % 900);
      const y = 22 + ((i * 47) % 110);
      const twinkle = 0.45 + Math.sin(game.elapsed * 4 + i) * 0.35;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(x, y, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  if (env.effect === "rain") {
    ctx.strokeStyle = "rgba(210, 232, 240, 0.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 42; i += 1) {
      const x = ((i * 67 + game.elapsed * 180) % 1020) - 40;
      const y = 20 + ((i * 43 + game.elapsed * 260) % 560);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y + 20);
      ctx.stroke();
    }
  }

  if (env.overlay) {
    ctx.fillStyle = env.overlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawHouse(house, i) {
  const d = 28;
  const x = house.x;
  const y = house.y;
  const w = house.w;
  const h = house.h;

  ctx.fillStyle = "rgba(42, 49, 39, 0.2)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2 + 16, y + h + 12, w * 0.55, 16, -0.05, 0, Math.PI * 2);
  ctx.fill();

  poly(
    [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
    house.wall,
    "#4b4a3c",
  );
  poly(
    [
      { x: x + w, y },
      { x: x + w + d, y: y + d },
      { x: x + w + d, y: y + h + d },
      { x: x + w, y: y + h },
    ],
    "rgba(80, 73, 67, 0.23)",
    "#4b4a3c",
  );
  poly(
    [
      { x: x - 12, y: y + 8 },
      { x: x + w / 2, y: y - 44 },
      { x: x + w + 12, y: y + 8 },
      { x: x + w + d, y: y + d + 8 },
      { x: x + w / 2 + d, y: y + d - 44 },
    ],
    house.roof,
    "#593425",
  );

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(house.x + 18, house.y + 24, 32, 26);
  ctx.fillRect(house.x + house.w - 50, house.y + 24, 32, 26);
  ctx.fillStyle = "#4c7695";
  ctx.fillRect(house.x + 23, house.y + 29, 22, 16);
  ctx.fillRect(house.x + house.w - 45, house.y + 29, 22, 16);

  ctx.fillStyle = i % 2 ? "#7a5035" : "#435d40";
  ctx.fillRect(house.x + house.w / 2 - 14, house.y + 38, 28, 44);
  ctx.fillStyle = "#f6d86f";
  ctx.beginPath();
  ctx.arc(house.x + house.w / 2 + 8, house.y + 62, 3, 0, Math.PI * 2);
  ctx.fill();

  const houseLabels = houseNames;
  if (houseLabels[i]) {
    ctx.fillStyle = "#fff8d6";
    ctx.strokeStyle = "#593425";
    ctx.lineWidth = 3;
    ctx.fillRect(house.x + 18, house.y + 4, 102, 24);
    ctx.strokeRect(house.x + 18, house.y + 4, 102, 24);
    ctx.fillStyle = "#243625";
    ctx.font = "800 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(houseLabels[i], house.x + 69, house.y + 21);
  }
}

function drawHouses() {
  game.houses.forEach(drawHouse);
}

function drawYards() {
  for (const yard of game.yards) {
    const bob = yardBob(yard);
    const y = yard.y + bob;
    const isCurrent = !yard.done && backPawsInYard(yard);
    const backLift = 16;
    poly(
      [
        { x: yard.x + 10, y },
        { x: yard.x + yard.w - 4, y: y - backLift },
        { x: yard.x + yard.w + 10, y: y + yard.h - 8 },
        { x: yard.x - 8, y: y + yard.h },
      ],
      yard.done ? "#6fa757" : "#a9d96f",
      "#456a3d",
    );

    ctx.strokeStyle = "rgba(49, 91, 43, 0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.moveTo(yard.x + 8 + i * 18, y + yard.h - 2);
      ctx.lineTo(yard.x + 28 + i * 18, y - 8);
      ctx.stroke();
    }

    ctx.fillStyle = "#f5f1dc";
    for (let x = yard.x + 8; x < yard.x + yard.w - 8; x += 16) {
      ctx.fillRect(x, y + yard.h - 14, 6, 22);
    }
    ctx.fillRect(yard.x + 4, y + yard.h - 7, yard.w - 8, 6);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(yard.gateX, y + yard.h);
    ctx.lineTo(yard.gateX, canvas.height - 116);
    ctx.stroke();

    if (isCurrent) {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.75;
      ctx.strokeRect(yard.x - 8, y - 18, yard.w + 16, yard.h + 38);
      ctx.globalAlpha = 1;
    }
  }
}

function poopRenderPosition(poop) {
  const yard = game.yards.find((candidate) => candidate.id === poop.yardId);
  if (!yard) {
    return { x: poop.x || 0, y: poop.y || 0 };
  }
  return {
    x: yard.x + poop.localX,
    y: yard.y + yardBob(yard) + poop.localY,
  };
}

function drawPoop(poop) {
  const position = poopRenderPosition(poop);
  const bounce = Math.sin(poop.pulse * 8) * 1.5;
  ctx.fillStyle = "#4c2d1c";
  ctx.beginPath();
  ctx.arc(position.x, position.y + bounce, poop.r, 0, Math.PI * 2);
  ctx.arc(position.x - 8, position.y + 5 + bounce, poop.r * 0.72, 0, Math.PI * 2);
  ctx.arc(position.x + 8, position.y + 6 + bounce, poop.r * 0.68, 0, Math.PI * 2);
  ctx.fill();
}

function drawNeighbor() {
  const neighbor = game.neighbor;
  const alert = neighbor.alert > 0;
  const leg = Math.sin(neighbor.stride) * (alert ? 12 : 6);

  ctx.save();
  ctx.translate(neighbor.x, neighbor.y);

  ctx.strokeStyle = "#243625";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 30);
  ctx.lineTo(-15 - leg, 54);
  ctx.moveTo(8, 30);
  ctx.lineTo(15 + leg, 54);
  ctx.moveTo(-22, 4);
  ctx.lineTo(-34, 18 + (alert ? Math.sin(neighbor.stride) * 8 : 0));
  ctx.moveTo(22, 4);
  ctx.lineTo(36, -6);
  ctx.stroke();

  ctx.fillStyle = alert ? "#ef476f" : "#2a9d8f";
  ctx.fillRect(-24, -6, 48, 42);

  ctx.fillStyle = "#f2c29a";
  ctx.beginPath();
  ctx.arc(0, -24, neighbor.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3b2921";
  ctx.beginPath();
  ctx.arc(0, -35, 24, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-9, -25, 5, 0, Math.PI * 2);
  ctx.arc(9, -25, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1d2d22";
  ctx.beginPath();
  ctx.arc(-8, -25, 2, 0, Math.PI * 2);
  ctx.arc(10, -25, 2, 0, Math.PI * 2);
  ctx.fill();

  if (alert) {
    ctx.strokeStyle = "#1d2d22";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-17, -35);
    ctx.lineTo(-4, -29);
    ctx.moveTo(17, -35);
    ctx.lineTo(4, -29);
    ctx.stroke();

    ctx.fillStyle = "#1d2d22";
    ctx.beginPath();
    ctx.ellipse(0, -12, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6d0c0";
    ctx.fillRect(-5, -15, 10, 3);
  } else {
    ctx.strokeStyle = "#1d2d22";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -13, 8, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  if (alert) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HEY!", 0, -58);
  }

  ctx.restore();
}

function drawDog() {
  const dog = game.dog;
  const stride = Math.sin(dog.stride);
  const counterStride = Math.sin(dog.stride + Math.PI);
  const lift = dog.moving ? Math.abs(stride) * 3.5 : Math.sin(game.elapsed * 2) * 1.2;
  const ear = Math.sin(dog.stride + 0.8) * (dog.moving ? 7 : 2);
  const chest = { x: 30, y: -1 };
  const hip = { x: -34, y: 4 };

  ctx.save();
  ctx.translate(dog.x, dog.y - lift);
  if (dog.facing < 0) ctx.scale(-1, 1);

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(-4, 42 + lift, 56, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2b211a";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawLeg = (topX, topY, kneeX, kneeY, pawX, pawY, color) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(pawX, pawY);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(pawX + 5, pawY + 2, 12, 5, -0.08, 0, Math.PI * 2);
    ctx.fill();
  };

  drawLeg(hip.x - 10, hip.y + 16, -48 - stride * 10, 30, -42 - stride * 19, 49, "#f1eee5");
  drawLeg(chest.x - 10, chest.y + 18, 15 + counterStride * 10, 31, 23 + counterStride * 17, 50, "#efe9de");
  drawLeg(hip.x + 12, hip.y + 17, -24 + counterStride * 11, 31, -18 + counterStride * 17, 51, "#9b6a35");
  drawLeg(chest.x + 10, chest.y + 18, 34 + stride * 11, 31, 42 + stride * 18, 50, "#9b6a35");

  ctx.strokeStyle = "#8a5f32";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-66, 0);
  ctx.quadraticCurveTo(-86, -26 - stride * 8, -98, -4);
  ctx.stroke();

  ctx.fillStyle = "#f4f1e8";
  ctx.beginPath();
  ctx.ellipse(-5, 2, 58, 27, 0.03, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9b6a35";
  ctx.beginPath();
  ctx.ellipse(hip.x - 2, hip.y - 2, 27, 25, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9b6a35";
  ctx.beginPath();
  ctx.ellipse(chest.x, chest.y - 2, 24, 25, -0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7f4ec";
  ctx.beginPath();
  ctx.ellipse(8, 9, 32, 17, 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f4f1e8";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(chest.x + 20, -11);
  ctx.quadraticCurveTo(45, -17, 55, -22);
  ctx.stroke();

  ctx.fillStyle = "#f4f1e8";
  ctx.beginPath();
  ctx.ellipse(53, -19, 17, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(43, 31, 24, 0.55)";
  ctx.beginPath();
  ctx.ellipse(47, -41 + ear, 7, 17, -0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(64, -29);
  ctx.rotate(stride * 0.05);
  ctx.beginPath();
  ctx.ellipse(0, 0, dog.r * 0.95, dog.r * 1.08, 0.03, 0, Math.PI * 2);
  ctx.clip();
  if (dogImg.complete && dogImg.naturalWidth) {
    ctx.drawImage(dogImg, -dog.r * 1.05, -dog.r * 1.16, dog.r * 2.1, dog.r * 2.32);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-dog.r, -dog.r, dog.r * 2, dog.r * 2);
  }
  ctx.restore();

  ctx.restore();
}

function drawCelebrationZiggy() {
  const saved = {
    x: game.dog.x,
    y: game.dog.y,
    moving: game.dog.moving,
    stride: game.dog.stride,
    facing: game.dog.facing,
  };
  const dance = game.elapsed * 10;
  const jump = Math.abs(Math.sin(dance)) * 46;

  game.dog.x = canvas.width / 2 + Math.sin(game.elapsed * 5) * 42;
  game.dog.y = canvas.height / 2 + 112 - jump;
  game.dog.moving = true;
  game.dog.stride = dance;
  game.dog.facing = Math.sin(game.elapsed * 4) >= 0 ? 1 : -1;

  ctx.save();
  ctx.translate(game.dog.x, game.dog.y);
  ctx.rotate(Math.sin(game.elapsed * 8) * 0.16);
  ctx.translate(-game.dog.x, -game.dog.y);
  drawDog();
  ctx.restore();

  Object.assign(game.dog, saved);
}

function drawMessage() {
  if (game.running || introActive) return;

  ctx.fillStyle = "rgba(31, 43, 31, 0.78)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (game.levelComplete || game.won) {
    drawCelebrationZiggy();
  }
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "800 52px Inter, system-ui, sans-serif";
  ctx.fillText(
    game.levelComplete
      ? "Level Cleared"
      : game.won
        ? `${dogName} Did It`
        : game.timedOut
          ? "Time Ran Out"
          : `${dogName} Got Caught`,
    canvas.width / 2,
    canvas.height / 2 - 18,
  );
  if (game.levelComplete) {
    ctx.font = "800 28px Inter, system-ui, sans-serif";
    ctx.fillText(`Level ${game.levelIndex + 1}: ${game.level.name}`, canvas.width / 2, canvas.height / 2 + 24);
  }
  ctx.font = "700 22px Inter, system-ui, sans-serif";
  ctx.fillText(
    game.levelComplete ? "Press Enter, Space, or click for the next level." : "Press Restart for another run.",
    canvas.width / 2,
    game.levelComplete ? canvas.height / 2 + 66 : canvas.height / 2 + 28,
  );
}

function drawIntro() {
  if (!introActive) return;

  const t = game.elapsed;
  ctx.fillStyle = "rgba(18, 34, 22, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2 - 50);
  ctx.rotate(t * 1.8);
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 112, 0, Math.PI * 2);
  ctx.clip();
  if (dogImg.complete && dogImg.naturalWidth) {
    ctx.drawImage(dogImg, -112, -112, 224, 224);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-112, -112, 224, 224);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(canvas.width / 2, 118 + Math.sin(t * 3) * 8);
  ctx.textAlign = "center";
  ctx.font = "900 58px Inter, system-ui, sans-serif";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#243625";
  ctx.strokeText(`${dogName} Poops`, 0, 0);
  ctx.fillStyle = "#ffd166";
  ctx.fillText(`${dogName} Poops`, 0, 0);
  ctx.font = "900 46px Inter, system-ui, sans-serif";
  ctx.strokeText("the Hood", 0, 52);
  ctx.fillStyle = "#ef476f";
  ctx.fillText("the Hood", 0, 52);
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "800 24px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  const pulse = 0.72 + Math.sin(t * 5) * 0.28;
  ctx.globalAlpha = pulse;
  ctx.fillText("Click, Enter, or Space to start", canvas.width / 2, canvas.height - 92);
  ctx.globalAlpha = 1;
  ctx.font = "700 16px Inter, system-ui, sans-serif";
  ctx.fillText("Clear six changing levels while the yards shrink and the neighbor speeds up.", canvas.width / 2, canvas.height - 62);
  ctx.fillText("Use Sing Intro if the browser blocks autoplay.", canvas.width / 2, canvas.height - 36);
  ctx.restore();

  if (audioReady && !introSongPlayed && game.elapsed > 0.45) {
    singIntro({ retryAudio: false });
  }
}

function draw() {
  drawSkyAndStreet();
  drawHouses();
  drawYards();

  const actors = [
    ...game.poops.map((poop) => ({ y: poopRenderPosition(poop).y, draw: () => drawPoop(poop) })),
    { y: game.neighbor.y + 55, draw: drawNeighbor },
    { y: game.dog.y + 44, draw: drawDog },
  ];
  actors.sort((a, b) => a.y - b.y);
  for (const actor of actors) {
    actor.draw();
  }

  drawMessage();
  drawIntro();
}

function tick(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;

  if (introActive) {
    updateWorld(dt);
    updateHud();
  } else if (game.running) {
    game.time -= dt;
    if (game.time <= 0) {
      game.time = 0;
      game.running = false;
      game.timedOut = true;
    }
    updateWorld(dt);
    updateDog(dt);
    updateNeighbor(dt);
    updateHud();
  } else {
    updateWorld(dt);
  }

  draw();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (isTypingField(event.target)) return;
  ensureAudio();
  const action = keyAction(event);
  if (["up", "down", "left", "right", "drop", "enter"].includes(action)) {
    event.preventDefault();
  }
  if (introActive && (action === "drop" || action === "enter")) {
    startGame();
    return;
  }
  if (game.levelComplete && (action === "drop" || action === "enter")) {
    nextLevel();
    return;
  }
  if (action === "drop") {
    dropPoop();
    return;
  }
  const direction = directionKey(action);
  if (direction) {
    keys.add(direction);
  }
});

window.addEventListener("keyup", (event) => {
  if (isTypingField(event.target)) return;
  const direction = directionKey(keyAction(event));
  if (direction) {
    keys.delete(direction);
  }
});

restartBtn.addEventListener("click", restart);
tryAgainBtn.addEventListener("click", tryAgain);
songBtn.addEventListener("click", () => {
  ensureAudio();
  introSpeechPlayed = false;
  introMelodyPlayed = false;
  singIntro({ retryAudio: true });
});
dropBtn.addEventListener("click", () => {
  ensureAudio();
  dropPoop();
});
canvas.addEventListener("click", () => {
  ensureAudio();
  if (game.levelComplete) {
    nextLevel();
    return;
  }
  startGame();
});
window.addEventListener("pointerdown", ensureAudio);
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = pickIntroVoice;
}

dogPhotoInput.addEventListener("change", () => {
  const file = dogPhotoInput.files && dogPhotoInput.files[0];
  if (!file) return;
  resizeDogPhoto(file, (dataUrl) => {
    selectedDogSrc = dataUrl;
    dogImg.src = selectedDogSrc;
    dogPreview.src = selectedDogSrc;
  });
});

dogNameInput.addEventListener("input", () => {
  dogName = cleanDogName(dogNameInput.value);
  dogLabel.textContent = dogName;
  document.title = `${dogName} Poops the Hood`;
});

for (const input of houseNameInputs) {
  input.addEventListener("input", () => {
    houseNames = houseNameInputs.map((field, index) => cleanHouseName(field.value, defaultHouseNames[index]));
  });
}

saveSetupBtn.addEventListener("click", saveDogSetup);
defaultSetupBtn.addEventListener("click", useDefaultDog);
setupBtn.addEventListener("click", openSetup);

for (const button of holdBtns) {
  const direction = button.dataset.hold;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    heldDirections.add(direction);
  });
  button.addEventListener("pointerup", () => heldDirections.delete(direction));
  button.addEventListener("pointercancel", () => heldDirections.delete(direction));
  button.addEventListener("lostpointercapture", () => heldDirections.delete(direction));
}

applyDogIdentity();
game = makeGame(currentLevel);
game.running = false;
openSetup();
requestAnimationFrame(tick);
