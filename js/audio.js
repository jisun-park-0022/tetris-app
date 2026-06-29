const TEMPO = 160;
const BEAT  = 60 / TEMPO;

const A4=440.00, B4=493.88;
const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99, A5=880.00;

// Korobeiniki (Tetris Theme A) — public domain folk song
const MELODY = [
  // Section 1
  [E5,1],[B4,.5],[C5,.5],[D5,1],[C5,.5],[B4,.5],
  [A4,1],[A4,.5],[C5,.5],[E5,1],[D5,.5],[C5,.5],
  [B4,1.5],[C5,.5],[D5,1],[E5,1],
  [C5,1],[A4,1],[A4,2],
  // Section 2
  [D5,2],[F5,.5],[A5,1],[G5,.5],
  [E5,1.5],[C5,.5],[E5,1],[D5,.5],[C5,.5],
  [B4,1],[B4,.5],[C5,.5],[D5,1],[E5,1],
  [C5,1],[A4,1],[A4,2],
];

class AudioManager {
  constructor() {
    this.ctx        = null;
    this.masterGain = null;
    this.muted      = false;
    this.playing    = false;
    this._noteIdx   = 0;
    this._timer     = null;
  }

  _ensureCtx() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.07;
    this.masterGain.connect(this.ctx.destination);
  }

  _tick() {
    if (!this.playing) return;
    const [freq, beats] = MELODY[this._noteIdx];
    const dur = beats * BEAT;

    if (freq > 0 && !this.muted) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.8, this.ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur * 0.88);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + dur);
    }

    this._noteIdx = (this._noteIdx + 1) % MELODY.length;
    this._timer = setTimeout(() => this._tick(), dur * 1000);
  }

  start() {
    this._ensureCtx();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stop();
    this.playing  = true;
    this._noteIdx = 0;
    this._tick();
  }

  stop() {
    this.playing = false;
    clearTimeout(this._timer);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
