export type TtsBackend = 'webspeech' | 'remote';

export interface ParentSettings {
  robotName: string;
  ttsBackend: TtsBackend;
  ttsVoiceUri: string | null;
  remoteTtsUrl: string;
}

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  robotName: 'Beep',
  ttsBackend: 'webspeech',
  ttsVoiceUri: null,
  remoteTtsUrl: '/api/tts',
};

const SETTINGS_KEY = 'reading_buddy_settings_v1';

export function loadParentSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_PARENT_SETTINGS };
    return { ...DEFAULT_PARENT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PARENT_SETTINGS };
  }
}

export function saveParentSettings(settings: ParentSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
