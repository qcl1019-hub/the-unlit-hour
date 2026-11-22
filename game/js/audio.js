// Synthesized WebAudio sound effects and ambient bed with mute and silent mode.
function sfxMulberry32(seed) {
  let a = seed >>> 0;
  return function sfxNextRand() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Sfx {
  constructor(opts) {
    const cfg = opts || {};
    this.silent = Boolean(cfg.silent);
    this.muted = false;
    this.ctx = null;
    this.master = null;
    this._noiseBuf = null;
    this._rng = sfxMulberry32(0x5F3759DF);
    this._ambienceRunning = false;
    this._ambienceGen = 0;
    this._ambienceNodes = [];
  }

  unlock() {
    if (this.silent) return;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(this.ctx.destination);
      this._noiseBuf = this._buildNoiseBuffer(1.5);
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this._ambienceRunning) {
        this._startAmbienceNodes();
      }
    } catch {
      this.ctx = null;
      this.master = null;
    }
  }

  _ready() {
    return !this.silent && !this.muted && Boolean(this.ctx) && Boolean(this.master);
  }

  _buildNoiseBuffer(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * seconds));
    const buf = this.ctx.createBuffer(1, length, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = this._rng() * 2 - 1;
    }
    return buf;
  }

  _connectOutput(node, pan) {
    if (typeof pan === 'number' && typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(panner);
      panner.connect(this.master);
      return;
    }
    node.connect(this.master);
  }

  setMuted(flag) {
    this.muted = Boolean(flag);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.02);
    }
  }

  step(sneaking) {
    if (!this._ready() || !this._noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const offset = this._rng() * 0.8;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(sneaking ? 400 : 620 + this._rng() * 120, now);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    const peak = sneaking ? 0.032 : 0.075;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now, offset, 0.075);
  }

  guardStep(pan, level) {
    if (!this._ready() || !this._noiseBuf) return;
    const gScale = Math.max(0, Math.min(1, Number(level) || 0));
    if (gScale <= 0.005) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const offset = this._rng() * 0.8;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(0.08 * gScale, now + 0.012);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    src.connect(filter);
    filter.connect(nGain);
    this._connectOutput(nGain, pan);
    src.start(now, offset, 0.1);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.075);

    const oGain = this.ctx.createGain();
    oGain.gain.setValueAtTime(0.0001, now);
    oGain.gain.exponentialRampToValueAtTime(0.065 * gScale, now + 0.008);
    oGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

    osc.connect(oGain);
    this._connectOutput(oGain, pan);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  creak() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const dur = 0.35;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.linearRampToValueAtTime(245, now + 0.14);
    osc.frequency.linearRampToValueAtTime(140, now + dur);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(28, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(520, now);
    bp.Q.value = 2.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.04);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(bp);
    bp.connect(gain);
    gain.connect(this.master);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur + 0.02);
    osc.stop(now + dur + 0.02);
  }

  thud() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(46, now + 0.14);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.16);

    if (this._noiseBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 280;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.06, now);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      src.connect(lp);
      lp.connect(nGain);
      nGain.connect(this.master);
      src.start(now, this._rng() * 0.5, 0.07);
    }
  }

  suspect() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.24);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  alert() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 783.99];

    for (let i = 0; i < freqs.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freqs[i], now);
      osc.frequency.exponentialRampToValueAtTime(freqs[i] * 1.18, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(freqs[i] * 0.96, now + 0.26);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2100, now);
      lp.frequency.exponentialRampToValueAtTime(900, now + 0.26);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(i === 0 ? 0.11 : 0.085, now + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  chime() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 880, 1174.66];

    for (let i = 0; i < notes.length; i++) {
      const t0 = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], t0);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.095 / (i + 1) * 1.4, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + 0.48);
    }
  }

  gate() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const chord = [220, 277.18, 329.63, 440];

    for (let i = 0; i < chord.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(chord[i], now);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1200, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  }

  pebble() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const clicks = [
      { delay: 0, startFreq: 1380, endFreq: 690, bpFreq: 1750, dur: 0.036, peak: 0.055 },
      { delay: 0.085, startFreq: 1060, endFreq: 540, bpFreq: 1350, dur: 0.03, peak: 0.03 },
    ];

    for (let i = 0; i < clicks.length; i++) {
      const c = clicks[i];
      const t0 = now + c.delay;

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.startFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(c.endFreq, t0 + c.dur);

      const oGain = this.ctx.createGain();
      oGain.gain.setValueAtTime(0.0001, t0);
      oGain.gain.exponentialRampToValueAtTime(c.peak, t0 + 0.004);
      oGain.gain.exponentialRampToValueAtTime(0.0001, t0 + c.dur);

      osc.connect(oGain);
      oGain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + c.dur + 0.01);

      if (this._noiseBuf) {
        const src = this.ctx.createBufferSource();
        src.buffer = this._noiseBuf;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(c.bpFreq, t0);
        bp.Q.value = 2.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.0001, t0);
        nGain.gain.exponentialRampToValueAtTime(c.peak * 0.85, t0 + 0.003);
        nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + c.dur);

        src.connect(bp);
        bp.connect(nGain);
        nGain.connect(this.master);
        src.start(t0, this._rng() * 0.6, c.dur + 0.01);
      }
    }
  }

  heartbeat(intensity) {
    if (!this._ready()) return;
    const level = Math.max(0, Math.min(1, Number(intensity) || 0));
    if (level <= 0.01) return;
    const now = this.ctx.currentTime;
    const pulses = [
      { delay: 0, startFreq: 64, endFreq: 38, dur: 0.11, peak: 0.032 + 0.088 * level },
      { delay: 0.14, startFreq: 56, endFreq: 34, dur: 0.1, peak: 0.02 + 0.058 * level },
    ];

    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const t0 = now + p.delay;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.startFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(p.endFreq, t0 + p.dur);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(160, t0);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(p.peak, t0 + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + p.dur + 0.015);
    }
  }

  douse() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(105, now + 0.25);

    const oGain = this.ctx.createGain();
    oGain.gain.setValueAtTime(0.0001, now);
    oGain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
    oGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(oGain);
    oGain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.28);

    if (this._noiseBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1250, now);
      bp.frequency.exponentialRampToValueAtTime(320, now + 0.24);
      bp.Q.value = 1.4;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      src.connect(bp);
      bp.connect(nGain);
      nGain.connect(this.master);
      src.start(now, this._rng() * 0.6, 0.26);
    }
  }

  startAmbience() {
    this._ambienceRunning = true;
    if (this.silent || !this.ctx || !this.master) return;
    if (this._ambienceNodes.length > 0) return;
    this._startAmbienceNodes();
  }

  _startAmbienceNodes() {
    if (this.silent || !this.ctx || !this.master || this._ambienceNodes.length > 0) return;
    const now = this.ctx.currentTime;
    const gen = ++this._ambienceGen;

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.linearRampToValueAtTime(0.026, now + 1.2);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(175, now);

    const oscA = this.ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(55, now);

    const oscB = this.ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.setValueAtTime(82.41, now);

    oscA.connect(lp);
    oscB.connect(lp);
    lp.connect(droneGain);
    droneGain.connect(this.master);

    oscA.start(now);
    oscB.start(now);

    this._ambienceNodes.push({ osc: oscA, gain: droneGain }, { osc: oscB, gain: droneGain });
    this._scheduleWaterLap(gen, now + 1.6 + this._rng() * 2.2);
  }

  _scheduleWaterLap(gen, startTime) {
    if (!this._ambienceRunning || gen !== this._ambienceGen || !this.ctx || !this.master || !this._noiseBuf) {
      return;
    }
    const dur = 0.55;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(340 + this._rng() * 120, startTime);
    bp.frequency.exponentialRampToValueAtTime(190, startTime + dur);
    bp.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.022, startTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

    src.connect(bp);
    bp.connect(gain);
    this._connectOutput(gain, (this._rng() * 2 - 1) * 0.6);

    src.onended = () => {
      if (!this._ambienceRunning || gen !== this._ambienceGen || !this.ctx) return;
      const next = this.ctx.currentTime + 2.4 + this._rng() * 3.2;
      this._scheduleWaterLap(gen, next);
    };

    src.start(startTime, this._rng() * 0.6, dur);
    this._ambienceNodes.push({ src, gain });
  }

  stopAmbience() {
    this._ambienceRunning = false;
    this._ambienceGen += 1;
    if (!this.ctx) {
      this._ambienceNodes = [];
      return;
    }
    const now = this.ctx.currentTime;
    for (const item of this._ambienceNodes) {
      try {
        if (item.gain) {
          item.gain.gain.setTargetAtTime(0.0001, now, 0.08);
        }
        if (item.osc) item.osc.stop(now + 0.25);
        if (item.src) {
          item.src.onended = null;
          item.src.stop(now + 0.25);
        }
      } catch {
        // Ignore already-stopped nodes.
      }
    }
    this._ambienceNodes = [];
  }
}
