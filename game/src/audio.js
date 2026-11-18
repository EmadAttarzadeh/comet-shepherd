// All sound is generated with WebAudio: soft pad chords for music and short
// synthesised effects for every action. Nothing is loaded from a file. The
// context is created on the first player gesture, as browsers require.

const CHORDS = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
  [164.81, 196.0, 246.94],
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicOn = false;
    this.chordIndex = 0;
    this.nextChordAt = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  startMusic() {
    if (!this.ensure()) return;
    this.musicOn = true;
    this.nextChordAt = this.ctx.currentTime + 0.1;
  }

  stopMusic() {
    this.musicOn = false;
  }

  update() {
    if (!this.musicOn || !this.ctx || this.muted) return;
    if (this.ctx.currentTime < this.nextChordAt) return;
    const notes = CHORDS[this.chordIndex % CHORDS.length];
    this.chordIndex += 1;
    for (const freq of notes) {
      this.padNote(freq, 4.6);
    }
    this.nextChordAt = this.ctx.currentTime + 4.4;
  }

  padNote(freq, seconds) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 1.1);
    gain.gain.setTargetAtTime(0, t + 2.6, 0.7);
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.25;
    osc.connect(gain);
    osc2.connect(gain2);
    gain2.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + seconds);
    osc2.stop(t + seconds);
  }

  tone({ freq, end, seconds, type = 'sine', volume = 0.3, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + seconds);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  }

  bump() {
    this.tone({ freq: 190, end: 90, seconds: 0.12, type: 'sine', volume: 0.35 });
  }

  dash() {
    this.tone({ freq: 320, end: 720, seconds: 0.16, type: 'triangle', volume: 0.22 });
  }

  pulse() {
    this.tone({ freq: 520, end: 180, seconds: 0.3, type: 'sine', volume: 0.3 });
    this.tone({ freq: 780, end: 260, seconds: 0.3, type: 'triangle', volume: 0.12 });
  }

  gate(colorIndex) {
    const tones = [523.25, 587.33, 659.25];
    const base = tones[((colorIndex % tones.length) + tones.length) % tones.length];
    this.tone({ freq: base, seconds: 0.28, type: 'sine', volume: 0.32 });
    this.tone({ freq: base * 1.5, seconds: 0.34, type: 'sine', volume: 0.26, delay: 0.07 });
  }

  wrongGate() {
    this.tone({ freq: 240, end: 190, seconds: 0.2, type: 'triangle', volume: 0.22 });
  }

  absorb() {
    this.tone({ freq: 420, end: 300, seconds: 0.18, type: 'sine', volume: 0.18 });
  }

  hurt() {
    this.tone({ freq: 160, end: 55, seconds: 0.42, type: 'sawtooth', volume: 0.3 });
    this.tone({ freq: 110, end: 48, seconds: 0.42, type: 'sine', volume: 0.32 });
  }

  shieldBlock() {
    this.tone({ freq: 880, seconds: 0.2, type: 'sine', volume: 0.25 });
    this.tone({ freq: 1320, seconds: 0.26, type: 'sine', volume: 0.18, delay: 0.06 });
  }

  pickup() {
    this.tone({ freq: 784, seconds: 0.14, type: 'sine', volume: 0.26 });
    this.tone({ freq: 1046, seconds: 0.16, type: 'sine', volume: 0.26, delay: 0.07 });
    this.tone({ freq: 1318, seconds: 0.22, type: 'sine', volume: 0.22, delay: 0.14 });
  }

  click() {
    this.tone({ freq: 660, seconds: 0.07, type: 'triangle', volume: 0.18 });
  }

  waveClear() {
    this.tone({ freq: 523, seconds: 0.18, type: 'sine', volume: 0.26 });
    this.tone({ freq: 659, seconds: 0.18, type: 'sine', volume: 0.26, delay: 0.1 });
    this.tone({ freq: 784, seconds: 0.3, type: 'sine', volume: 0.28, delay: 0.2 });
  }

  win() {
    [523, 659, 784, 1046, 1318].forEach((freq, i) => {
      this.tone({ freq, seconds: 0.42, type: 'sine', volume: 0.28, delay: i * 0.13 });
    });
  }

  lose() {
    [392, 330, 262, 196].forEach((freq, i) => {
      this.tone({ freq, seconds: 0.5, type: 'triangle', volume: 0.24, delay: i * 0.18 });
    });
  }
}
