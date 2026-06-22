import { INSTRUCTIONS } from './instructions';

export type TtsBackend = 'webspeech' | 'remote';

type PlayStateListener = (playing: boolean) => void;

class AudioServiceImpl {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private unlocked = false;
  private ttsBackend: TtsBackend = 'webspeech';
  private playStateListeners = new Set<PlayStateListener>();
  private preferredVoice: SpeechSynthesisVoice | null = null;

  onPlayStateChange(listener: PlayStateListener): () => void {
    this.playStateListeners.add(listener);
    return () => this.playStateListeners.delete(listener);
  }

  private setPlaying(playing: boolean): void {
    this.playStateListeners.forEach((l) => l(playing));
  }

  setTtsBackend(backend: TtsBackend): void {
    this.ttsBackend = backend;
  }

  getTtsBackend(): TtsBackend {
    return this.ttsBackend;
  }

  setPreferredVoiceUri(uri: string | null): void {
    if (!uri) {
      this.preferredVoice = null;
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    this.preferredVoice = voices.find((v) => v.voiceURI === uri) ?? null;
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    this.audioContext ??= new AudioContext();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
    this.unlocked = true;
    this.loadVoices();
  }

  private loadVoices(): void {
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.lang.startsWith('en') && v.localService)
        ?? voices.find((v) => v.lang.startsWith('en'))
        ?? voices[0]
        ?? null;
      if (!this.preferredVoice) this.preferredVoice = en;
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }

  async speakClip(key: string): Promise<void> {
    this.stopClip();
    const url = `/audio/${key}.mp3`;

    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) throw new Error(`Missing clip: ${key}`);
    } catch {
      console.warn(`[Reading Buddy] Missing clip: ${key}`);
      this.speakText(INSTRUCTIONS.skipMissing);
      return;
    }

    return new Promise((resolve) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.setPlaying(true);

      audio.onended = () => {
        if (this.currentAudio === audio) this.currentAudio = null;
        this.setPlaying(false);
        resolve();
      };
      audio.onerror = () => {
        console.warn(`[Reading Buddy] Failed to play clip: ${key}`);
        if (this.currentAudio === audio) this.currentAudio = null;
        this.setPlaying(false);
        this.speakText(INSTRUCTIONS.skipMissing);
        resolve();
      };

      void audio.play().catch(() => {
        console.warn(`[Reading Buddy] Playback blocked for: ${key}`);
        this.setPlaying(false);
        resolve();
      });
    });
  }

  async speakBlendFallback(word: string): Promise<void> {
    for (const ch of word) {
      await this.speakClip(`sound_${ch}`);
    }
    await this.speakClip(`word_${word}`);
  }

  async speakBlend(word: string): Promise<void> {
    const blendKey = `blend_${word}`;
    try {
      const head = await fetch(`/audio/${blendKey}.mp3`, { method: 'HEAD' });
      if (head.ok) {
        await this.speakClip(blendKey);
        return;
      }
    } catch {
      // fall through
    }
    await this.speakBlendFallback(word);
  }

  speakText(text: string): void {
    this.stopTts();
    if (this.ttsBackend === 'remote') {
      // TODO(ask human): wire Lambda URL for remote TTS backend
      console.warn('[Reading Buddy] Remote TTS not configured, falling back to webspeech');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    if (this.preferredVoice) utterance.voice = this.preferredVoice;

    utterance.onstart = () => this.setPlaying(true);
    utterance.onend = () => this.setPlaying(false);
    utterance.onerror = () => this.setPlaying(false);

    window.speechSynthesis.speak(utterance);
  }

  stopAll(): void {
    this.stopClip();
    this.stopTts();
    this.setPlaying(false);
  }

  private stopClip(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  private stopTts(): void {
    window.speechSynthesis.cancel();
  }
}

export const audioService = new AudioServiceImpl();
