/**
 * The haunt's voice — a fully synthesized horror ambience. No audio files,
 * no licensing, nothing to download: a sub-bass drone, a slow wind, and a
 * cracked bell toll for the moment the grave breaks open.
 *
 * Browsers block sound until the user gestures. `start()` is safe to call
 * immediately — if the context is suspended it re-arms itself on the first
 * pointer/key event anywhere on the page.
 */
export class HauntAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private armed = false;
  private on = false;

  /** Try to begin. Returns true if audio is actually sounding. */
  start(): boolean {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
      }
      const ctx = this.ctx;
      if (ctx.state === "suspended") {
        void ctx.resume().then(() => this.arm());
        this.armGestures();
        return false;
      }
      this.arm();
      return this.on;
    } catch {
      return false;
    }
  }

  /** Re-arm on the first user gesture when autoplay policy held us back. */
  private armGestures(): void {
    if (this.armed) return;
    this.armed = true;
    const kick = () => {
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("keydown", kick);
      this.armed = false;
      if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume().then(() => this.arm());
      else this.arm();
    };
    document.addEventListener("pointerdown", kick, { once: true });
    document.addEventListener("keydown", kick, { once: true });
  }

  private arm(): void {
    const ctx = this.ctx;
    if (!ctx || this.on || ctx.state !== "running") return;
    this.on = true;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2.2);
    master.connect(ctx.destination);
    this.master = master;

    // — the drone: two detuned saws low-passed into a cold hum, plus a sub floor —
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 240;
    droneFilter.Q.value = 0.8;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    droneFilter.connect(droneGain).connect(master);
    for (const [freq, type, detune] of [
      [55, "sawtooth", 0],
      [55.6, "sawtooth", 6],
      [36.5, "sine", 0],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = freq < 40 ? 0.5 : 0.32;
      osc.connect(g).connect(droneFilter);
      osc.start();
      this.nodes.push(osc);
    }

    // — the wind: filtered noise, its band swept by a very slow LFO —
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 480;
    band.Q.value = 1.4;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.028;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 260;
    lfo.connect(lfoDepth).connect(band.frequency);
    noise.connect(band).connect(windGain).connect(master);
    noise.start();
    lfo.start();
    this.nodes.push(noise, lfo);
  }

  /** A cracked church bell — played when the grave breaks open. */
  toll(): void {
    const ctx = this.ctx;
    if (!ctx || !this.on || !this.master) return;
    const strike = (t: number, base: number, vol: number) => {
      for (const [f, g] of [
        [base, 1],
        [base * 2.01, 0.36],
        [base * 2.94, 0.18],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.985, t + 2.4);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.16 * vol * g, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
        osc.connect(gain).connect(this.master!);
        osc.start(t);
        osc.stop(t + 2.7);
      }
    };
    const t0 = ctx.currentTime + 0.02;
    strike(t0, 196, 1); // G3 — the grave cracks
    strike(t0 + 0.42, 146.8, 0.7); // D3 — the answer, lower, uneasy
  }

  /** Fade everything out and release the voices. */
  stop(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.7);
    const nodes = this.nodes;
    const master = this.master;
    this.nodes = [];
    this.master = null;
    this.on = false;
    setTimeout(() => {
      nodes.forEach((n) => {
        try {
          (n as OscillatorNode).stop?.();
        } catch {
          /* already silent */
        }
        n.disconnect();
      });
      master.disconnect();
    }, 900);
  }
}
