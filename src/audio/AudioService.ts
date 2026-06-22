import { INSTRUCTIONS } from './instructions';
import type { TtsBackend } from '../settings/parentSettings';

type PlayStateListener = (playing: boolean) => void;

class AudioServiceImpl {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTtsAudio: HTMLAudioElement | null = null;
  private unlocked = false;
  private ttsBackend: TtsBackend = 'webspeech';
  private remoteTtsUrl = '/api/tts';
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

  setRemoteTtsUrl(url: string): void {
    this.remoteTtsUrl = url || '/api/tts';
  }

  getRemoteTtsUrl(): string {
    return this.remoteTtsUrl;
  }

  setPreferredVoiceUri(uri: string | null): void {
    if (!uri) {
      this.preferredVoice = null;
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    this.preferredVoice = voices.find((v) => v.voiceURI === uri) ?? null;
  }

  applyParentSettings(settings: {
    ttsBackend: TtsBackend;
    ttsVoiceUri: string | null;
    remoteTtsUrl: string;
  }): void {
    this.setTtsBackend(settings.ttsBackend);
    this.setRemoteTtsUrl(settings.remoteTtsUrl);
    this.setPreferredVoiceUri(settings.ttsVoiceUri);
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

    return this.playAudioUrl(url);
  }

  private playAudioUrl(url: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.setPlaying(true);

      const cleanup = () => {
        if (this.currentAudio === audio) this.currentAudio = null;
        this.setPlaying(false);
        resolve();
      };

      audio.onended = cleanup;
      audio.onerror = () => {
        console.warn(`[Reading Buddy] Failed to play: ${url}`);
        cleanup();
      };

      void audio.play().catch(() => {
        console.warn(`[Reading Buddy] Playback blocked: ${url}`);
        cleanup();
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
      void this.speakTextRemote(text);
      return;
    }
    this.speakTextWebSpeech(text);
  }

  private speakTextWebSpeech(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    if (this.preferredVoice) utterance.voice = this.preferredVoice;

    utterance.onstart = () => this.setPlaying(true);
    utterance.onend = () => this.setPlaying(false);
    utterance.onerror = () => this.setPlaying(false);

    window.speechSynthesis.speak(utterance);
  }

  private async speakTextRemote(text: string): Promise<void> {
    try {
      const res = await fetch(this.remoteTtsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`Remote TTS HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      await new Promise<void>((resolve) => {
        const audio = new Audio(objectUrl);
        this.currentTtsAudio = audio;
        this.setPlaying(true);

        const done = () => {
          URL.revokeObjectURL(objectUrl);
          if (this.currentTtsAudio === audio) this.currentTtsAudio = null;
          this.setPlaying(false);
          resolve();
        };

        audio.onended = done;
        audio.onerror = () => {
          console.warn('[Reading Buddy] Remote TTS playback failed');
          done();
        };

        void audio.play().catch(() => {
          console.warn('[Reading Buddy] Remote TTS play blocked');
          done();
        });
      });
    } catch (err) {
      console.warn('[Reading Buddy] Remote TTS failed, falling back to webspeech:', err);
      this.speakTextWebSpeech(text);
    }
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
    if (this.currentTtsAudio) {
      this.currentTtsAudio.pause();
      this.currentTtsAudio.currentTime = 0;
      this.currentTtsAudio = null;
    }
  }
}

export const audioService = new AudioServiceImpl();
