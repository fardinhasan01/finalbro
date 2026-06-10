let ctx: AudioContext | null = null;
let bgNode: OscillatorNode | null = null;
let bgGain: GainNode | null = null;
let runInterval: ReturnType<typeof setInterval> | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  startTime?: number
) {
  if (muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime ?? c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, (startTime ?? c.currentTime) + duration);
  osc.start(startTime ?? c.currentTime);
  osc.stop((startTime ?? c.currentTime) + duration);
}

function playNoise(duration: number, volume = 0.08, filterFreq = 800) {
  if (muted) return;
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start();
}

export function playJump() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(280, 0.06, "sine", 0.28, now);
  playTone(420, 0.08, "sine", 0.22, now + 0.04);
  playTone(620, 0.12, "triangle", 0.18, now + 0.1);
  playNoise(0.04, 0.05, 1200);
}

export function playLand() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(180, 0.08, "sine", 0.15, now);
  playNoise(0.06, 0.06, 400);
}

export function playSlide() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.start(now);
  osc.stop(now + 0.22);
  playNoise(0.12, 0.04, 600);
}

export function playCorrect() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const melody = [523, 659, 784, 988, 1047];
  melody.forEach((f, i) => {
    playTone(f, 0.16, "sine", 0.28, now + i * 0.1);
  });
  playNoise(0.08, 0.04, 2000);
}

export function playWrong() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(300, 0.15, "sawtooth", 0.32, now);
  playTone(220, 0.2, "sawtooth", 0.28, now + 0.14);
  playTone(150, 0.3, "square", 0.22, now + 0.28);
}

export function playClick() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(900, 0.03, "sine", 0.12, now);
  playTone(700, 0.04, "sine", 0.08, now + 0.02);
}

export function playPowerUp() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  [440, 554, 659, 880, 1108].forEach((f, i) => {
    playTone(f, 0.1, "sine", 0.22, now + i * 0.07);
  });
}

export function playLoseLife() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(440, 0.1, "square", 0.35, now);
  playTone(350, 0.1, "square", 0.3, now + 0.12);
  playTone(250, 0.2, "square", 0.25, now + 0.24);
}

export function playCelebration() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  const fanfare = [392, 523, 659, 784, 988, 1175, 1319];
  fanfare.forEach((f, i) => {
    playTone(f, 0.25, "triangle", 0.3, now + i * 0.15);
    playTone(f * 0.5, 0.25, "sine", 0.15, now + i * 0.15);
  });
  setTimeout(() => {
    if (!muted) playNoise(0.3, 0.06, 3000);
  }, 200);
}

export function playCertificateReveal() {
  if (muted) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(523, 0.2, "sine", 0.25, now);
  playTone(659, 0.2, "sine", 0.22, now + 0.2);
  playTone(784, 0.35, "sine", 0.28, now + 0.4);
}

export function startRunningSfx() {
  if (muted || runInterval) return;
  runInterval = setInterval(() => {
    if (muted) return;
    playNoise(0.03, 0.03, 500 + Math.random() * 200);
  }, 350);
}

export function stopRunningSfx() {
  if (runInterval) {
    clearInterval(runInterval);
    runInterval = null;
  }
}

export function startBgMusic() {
  if (muted || bgNode) return;
  const c = getCtx();
  bgGain = c.createGain();
  bgGain.gain.value = 0.1;
  bgGain.connect(c.destination);

  // Pentatonic Bangladesh-inspired melody
  const melodyNotes = [261, 293, 329, 392, 440, 392, 329, 293];
  const bassNotes = [130, 146, 164, 196, 174, 146];

  function makeLayer(freqs: number[], interval: number, type: OscillatorType, vol: number) {
    const lGain = c.createGain();
    lGain.gain.value = vol;
    lGain.connect(bgGain!);
    let idx = 0;
    const play = () => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = freqs[idx % freqs.length];
      osc.connect(lGain);
      osc.start();
      osc.stop(c.currentTime + interval * 0.85);
      idx++;
    };
    play();
    return setInterval(play, interval * 1000);
  }

  const id1 = makeLayer(melodyNotes, 0.45, "triangle", 0.55);
  const id2 = makeLayer(bassNotes, 0.9, "sine", 0.45);
  const id3 = makeLayer([523, 587, 659], 1.8, "sine", 0.2);

  (bgGain as GainNode & { _intervals?: ReturnType<typeof setInterval>[] })._intervals = [id1, id2, id3];
  startRunningSfx();
}

export function stopBgMusic() {
  stopRunningSfx();
  if (!bgGain) return;
  const intervals: ReturnType<typeof setInterval>[] =
    (bgGain as GainNode & { _intervals?: ReturnType<typeof setInterval>[] })._intervals ?? [];
  intervals.forEach(clearInterval);
  bgGain.gain.setValueAtTime(bgGain.gain.value, getCtx().currentTime);
  bgGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
  bgNode = null;
  bgGain = null;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (muted) stopBgMusic();
  else startBgMusic();
  return muted;
}

export function isMuted() {
  return muted;
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}
