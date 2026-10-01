export type SoundEvent =
  | 'reveal'
  | 'start'
  | 'timer'
  | 'ten'
  | 'five'
  | 'one'
  | 'thirty'
  | 'expire'
  | 'transition'
  | 'pitch'
  | 'pitch-warning'
  | 'pitch-complete'
  | 'complete'
  | 'click'
  | 'check'
  | 'roulette-tick'
  | 'roulette-hit';

interface SoundOptions {
  speedRatio?: number;
  isNearStop?: boolean;
  volume?: number;
}

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  } catch {
    // Ignore audio context autoplay restriction errors until user interacts
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 0.05; // 50ms of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

/**
 * Procedural mechanical tick for the topic roulette.
 * Generates an acoustic mechanical switch click composed of:
 * 1. Filtered noise transient for physical snap
 * 2. Tuned body resonance that deepens as the wheel decelerates
 */
function playRouletteTick(ctx: AudioContext, masterVolume: number, speedRatio = 0.5, isNearStop = false) {
  const now = ctx.currentTime;
  const vol = Math.max(0.01, Math.min(1, masterVolume));

  // 1. High-frequency physical impact burst (mechanical detent snap)
  try {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Frequency shifts lower as wheel slows down for heavier mechanical feel
    filter.frequency.setValueAtTime(isNearStop ? 2200 : 3200 + speedRatio * 1800, now);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    const noiseVol = vol * (isNearStop ? 0.35 : 0.22);
    noiseGain.gain.setValueAtTime(noiseVol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + (isNearStop ? 0.025 : 0.012));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.03);
  } catch {
    // Fallback if buffer fails
  }

  // 2. Resonant body thud (gives it satisfying physical weight)
  try {
    const osc = ctx.createOscillator();
    const bodyGain = ctx.createGain();

    osc.type = isNearStop ? 'triangle' : 'sine';
    const baseFreq = isNearStop ? 280 : 420 + speedRatio * 260;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.02);

    const bodyVol = vol * (isNearStop ? 0.4 : 0.18 + speedRatio * 0.08);
    bodyGain.gain.setValueAtTime(bodyVol, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + (isNearStop ? 0.035 : 0.02));

    osc.connect(bodyGain);
    bodyGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore audio node cleanup
  }
}

/**
 * Dramatic final selection sound.
 * Combines:
 * - Heavy mechanical lock click
 * - Low bass punch impact
 * - Warm tonal resolution chime
 */
function playRouletteHit(ctx: AudioContext, masterVolume: number) {
  const now = ctx.currentTime;
  const vol = Math.max(0.01, Math.min(1, masterVolume));

  // 1. Heavy physical latch impact
  try {
    const latchNoise = ctx.createBufferSource();
    latchNoise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);

    const latchGain = ctx.createGain();
    latchGain.gain.setValueAtTime(vol * 0.5, now);
    latchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    latchNoise.connect(filter);
    filter.connect(latchGain);
    latchGain.connect(ctx.destination);
    latchNoise.start(now);
    latchNoise.stop(now + 0.06);
  } catch {}

  // 2. Deep sub-bass punch (thud of the mechanical selector locking in)
  try {
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.14);

    subGain.gain.setValueAtTime(vol * 0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.2);
  } catch {}

  // 3. Crisp metallic snap
  try {
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(840, now);
    snapOsc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

    snapGain.gain.setValueAtTime(vol * 0.35, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.05);
  } catch {}

  // 4. Subtle, triumphant tonal confirmation chime (C5 + G5 harmonic)
  const chimeNotes = [523.25, 783.99]; // C5 and G5
  chimeNotes.forEach((freq, idx) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = 0.015 + idx * 0.02;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol * 0.22, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.35);
    } catch {}
  });
}

const tonalPatterns: Record<Exclude<SoundEvent, 'roulette-tick' | 'roulette-hit'>, number[]> = {
  reveal: [220, 330, 440, 660],
  start: [180, 360, 540],
  timer: [440],
  ten: [330, 440],
  five: [330, 440, 550],
  one: [440, 550, 660],
  thirty: [660, 770, 880],
  expire: [330, 220, 165, 110],
  transition: [220, 330, 440, 550],
  pitch: [330, 660],
  'pitch-warning': [440, 440],
  'pitch-complete': [660, 440, 220],
  complete: [330, 440, 550, 660],
  click: [280],
  check: [600, 800],
};

export function sound(event: SoundEvent, enabled: boolean, volume: number, options?: SoundOptions) {
  if (!enabled || volume <= 0) return;
  try {
    unlockAudio();
    const ctx = getAudioContext();
    if (!ctx) return;

    if (event === 'roulette-tick') {
      playRouletteTick(ctx, volume, options?.speedRatio ?? 0.5, options?.isNearStop ?? false);
      return;
    }

    if (event === 'roulette-hit') {
      playRouletteHit(ctx, volume);
      return;
    }

    // Default tonal patterns
    const freqs = tonalPatterns[event];
    if (!freqs) return;

    const baseVol = Math.max(0.01, Math.min(1, volume));
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = ctx.currentTime + i * 0.085;

      osc.type = event === 'click' ? 'triangle' : event === 'check' ? 'sine' : 'sine';
      osc.frequency.setValueAtTime(freq, at);

      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(baseVol * 0.18, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.18);
    });
  } catch {
    // Graceful error silence
  }
}

class SoundEngine {
  private enabled = true;
  private volume = 0.35;

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = volume;
  }

  unlock() {
    unlockAudio();
  }

  play(event: SoundEvent, options?: SoundOptions) {
    sound(event, this.enabled, this.volume, options);
  }

  rouletteTick(speedRatio = 0.5, isNearStop = false) {
    if (!this.enabled || this.volume <= 0) return;
    sound('roulette-tick', this.enabled, this.volume, { speedRatio, isNearStop });
  }

  rouletteHit() {
    if (!this.enabled || this.volume <= 0) return;
    sound('roulette-hit', this.enabled, this.volume);
  }
}

export const soundManager = new SoundEngine();
