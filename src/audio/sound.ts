/**
 * Sound (DESK_SPEC §2): off by default, remembered. Everything is synthesised with WebAudio — room tone, a
 * breeze that swells with the shared wind, birds by day / crickets by night, and one-shots — so there are no
 * audio files to download or license.
 */
import { create } from 'zustand';
import { wind } from '../scene/wind';
import { nightMix } from '../scene/dayNight';

const KEY = 'desk-sound';
const readPref = () => {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
};

type Shot = 'rustle' | 'swoosh' | 'clink' | 'pour' | 'click' | 'tick';

class Engine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private breeze: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private raf = 0;
  private nextCall = 0;

  start() {
    if (!this.ctx) this.build();
    void this.ctx!.resume();
    this.master!.gain.setTargetAtTime(0.9, this.ctx!.currentTime, 0.3);
    cancelAnimationFrame(this.raf);
    const tick = () => {
      this.update();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    cancelAnimationFrame(this.raf);
    setTimeout(() => void this.ctx?.suspend(), 600);
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    // Shared white-noise buffer.
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // Room tone: low, soft noise.
    const room = this.loop(buf);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const roomGain = ctx.createGain();
    roomGain.gain.value = 0.05;
    room.connect(lp).connect(roomGain).connect(this.master);
    // Breeze: band-passed noise following the wind.
    const air = this.loop(buf);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.6;
    this.breeze = ctx.createGain();
    this.breeze.gain.value = 0;
    air.connect(bp).connect(this.breeze).connect(this.master);
  }

  private loop(buf: AudioBuffer) {
    const s = this.ctx!.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start();
    return s;
  }

  private update() {
    const ctx = this.ctx!;
    this.breeze!.gain.setTargetAtTime(0.02 + wind.strength * 0.09, ctx.currentTime, 0.4);
    if (ctx.currentTime > this.nextCall) {
      const night = nightMix() > 0.5;
      if (night) this.cricket();
      else this.bird();
      this.nextCall = ctx.currentTime + (night ? 0.6 + Math.random() * 1.4 : 3 + Math.random() * 6);
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private bird() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t0 = t + i * 0.13;
      const f = 2600 + Math.random() * 1400;
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * (1.2 + Math.random() * 0.3), t0 + 0.08);
      this.env(g, t0, 0.012, 0.01, 0.09);
      o.connect(g).connect(this.master!);
      o.start(t0);
      o.stop(t0 + 0.12);
    }
  }

  private cricket() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t0 = t + i * 0.06;
      o.frequency.value = 4400 + Math.random() * 200;
      this.env(g, t0, 0.006, 0.005, 0.035);
      o.connect(g).connect(this.master!);
      o.start(t0);
      o.stop(t0 + 0.05);
    }
  }

  play(shot: Shot) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const pitch = 1 + (Math.random() - 0.5) * 0.16; // ±8%
    const burst = (freq: number, q: number, peak: number, attack: number, decay: number, sweepTo?: number) => {
      const s = ctx.createBufferSource();
      s.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(freq * pitch, t);
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo * pitch, t + attack + decay);
      f.Q.value = q;
      const g = ctx.createGain();
      this.env(g, t, peak, attack, decay);
      s.connect(f).connect(g).connect(this.master!);
      s.start(t, Math.random());
      s.stop(t + attack + decay + 0.05);
    };
    switch (shot) {
      case 'rustle':
        burst(2200, 0.8, 0.12, 0.02, 0.35);
        break;
      case 'swoosh':
        burst(900, 1.2, 0.1, 0.06, 0.3, 3200);
        break;
      case 'pour':
        burst(600, 0.5, 0.08, 0.1, 1.0, 300);
        break;
      case 'tick':
        burst(3500, 2, 0.08, 0.002, 0.04);
        break;
      case 'click':
        burst(2500, 1.5, 0.2, 0.001, 0.03);
        break;
      case 'clink': {
        for (const [f, a] of [
          [2150, 0.05],
          [3470, 0.03],
          [5230, 0.018],
        ] as const) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = f * pitch;
          this.env(g, t, a, 0.002, 0.6);
          o.connect(g).connect(this.master!);
          o.start(t);
          o.stop(t + 0.7);
        }
        break;
      }
    }
  }
}

const engine = new Engine();

export const useSound = create<{ on: boolean; toggle: () => void }>((set, get) => ({
  on: false,
  toggle: () => {
    const on = !get().on;
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      // session-only choice
    }
    set({ on });
    if (on) engine.start();
    else engine.stop();
  },
}));

/** The remembered preference is applied on the first user gesture (browsers block autoplay). */
if (readPref()) {
  const resume = () => {
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
    if (!useSound.getState().on) useSound.getState().toggle();
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

/** Play a one-shot (no-op while sound is off). */
export const sfx = (shot: Shot) => {
  if (useSound.getState().on) engine.play(shot);
};
