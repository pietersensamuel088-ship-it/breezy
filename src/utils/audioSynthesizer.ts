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

  public startRhythm(_genre?: string, _bpm = 88) {
    // Silenced: Real master audio tracks are active, no preview synth beeps needed
    this.stopRhythm();
    this.isSynthesizing = false;
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
