// High-fidelity Web Audio Synthesizer for instant audible playback in browser

class AudioPlaybackService {
  private ctx: AudioContext | null = null;
  private isSynthesizing = false;
  private intervalId: number | null = null;
  public analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public startRhythm(genre: string, bpm = 88) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    this.stopRhythm();
    this.isSynthesizing = true;

    const chords = [
      [220, 261.63, 329.63, 392], // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196, 246.94], // Cmaj7
      [196, 246.94, 293.66, 349.23], // G7
    ];

    let chordIndex = 0;
    const beatIntervalMs = (60 / bpm) * 1000;

    const playChordAndBass = () => {
      if (!this.ctx || !this.masterGain || !this.isSynthesizing) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex % chords.length];

      // 808 Sub-bass kick
      const oscBass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      oscBass.type = 'sine';
      oscBass.frequency.setValueAtTime(currentChord[0] / 2, now);
      oscBass.frequency.exponentialRampToValueAtTime(35, now + 0.4);
      bassGain.gain.setValueAtTime(0.8, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      oscBass.connect(bassGain);
      bassGain.connect(this.masterGain);
      oscBass.start(now);
      oscBass.stop(now + 0.9);

      // Lush R&B Electric Piano Chords
      currentChord.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        chordGain.gain.setValueAtTime(0.08, now);
        chordGain.gain.exponentialRampToValueAtTime(0.005, now + 1.8);

        osc.connect(chordGain);
        chordGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.9);
      });

      chordIndex++;
    };

    playChordAndBass();
    this.intervalId = window.setInterval(playChordAndBass, beatIntervalMs * 2);
  }

  public stopRhythm() {
    this.isSynthesizing = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }
}

export const audioSynth = new AudioPlaybackService();
