import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { ROBOT_PARTS } from '../reward/robotParts';
import { loadParentSettings } from '../settings/parentSettings';
import { BigButton } from '../ui/BigButton';
import './Settings.css';

export function Settings() {
  const robotName = useStore((s) => s.robotName);
  const setRobotName = useStore((s) => s.setRobotName);
  const ttsVoiceUri = useStore((s) => s.ttsVoiceUri);
  const setTtsVoiceUri = useStore((s) => s.setTtsVoiceUri);
  const setTtsBackend = useStore((s) => s.setTtsBackend);
  const setRemoteTtsUrl = useStore((s) => s.setRemoteTtsUrl);
  const resetProgress = useStore((s) => s.resetProgress);
  const setScreen = useStore((s) => s.setScreen);
  const progress = useStore((s) => s.progress);

  const [ttsBackend, setTtsBackendLocal] = useState(loadParentSettings().ttsBackend);
  const [remoteTtsUrl, setRemoteTtsUrlLocal] = useState(loadParentSettings().remoteTtsUrl);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const enVoices = voices.filter((v) => v.lang.startsWith('en'));

  const handleTestTts = () => {
    setTestStatus('Playing…');
    audioService.speakText(INSTRUCTIONS.greatJob);
    setTimeout(() => setTestStatus(null), 2000);
  };

  return (
    <div className="settings parent-only-screen">
      <h1>Settings</h1>

      <label className="settings__field">
        Robot name
        <input
          type="text"
          value={robotName}
          onChange={(e) => setRobotName(e.target.value || 'Beep')}
          maxLength={20}
        />
      </label>

      <label className="settings__field">
        TTS backend
        <select
          value={ttsBackend}
          onChange={(e) => {
            const backend = e.target.value as 'webspeech' | 'remote';
            setTtsBackendLocal(backend);
            setTtsBackend(backend);
          }}
        >
          <option value="webspeech">Web Speech (default)</option>
          <option value="remote">Remote (Polly / ElevenLabs)</option>
        </select>
      </label>

      {ttsBackend === 'webspeech' && (
        <label className="settings__field">
          TTS voice
          <select
            value={ttsVoiceUri ?? ''}
            onChange={(e) => setTtsVoiceUri(e.target.value || null)}
          >
            <option value="">Default</option>
            {enVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>
      )}

      {ttsBackend === 'remote' && (
        <label className="settings__field">
          Remote TTS URL
          <input
            type="url"
            value={remoteTtsUrl}
            onChange={(e) => {
              setRemoteTtsUrlLocal(e.target.value);
              setRemoteTtsUrl(e.target.value);
            }}
            placeholder="/api/tts"
          />
          <span className="settings__hint">
            Dev: run <code>npm run dev:tts</code> and use /api/tts. Prod: your API Gateway URL.
          </span>
        </label>
      )}

      <button type="button" className="settings__test" onClick={handleTestTts}>
        Test voice
      </button>
      {testStatus && <p className="settings__hint">{testStatus}</p>}

      <div className="settings__stats">
        <p>Stars: {progress.stars}</p>
        <p>Lessons completed: {progress.completedLessonIds.length} / 12</p>
        <p>Unlocked parts: {progress.unlockedPartIds.length} / {ROBOT_PARTS.length}</p>
      </div>

      <button
        type="button"
        className="settings__danger"
        onClick={() => {
          if (window.confirm('Reset all progress? This cannot be undone.')) {
            resetProgress();
          }
        }}
      >
        Reset progress
      </button>

      <BigButton onPress={() => setScreen('home')} ariaLabel="Back to home">
        ← Back
      </BigButton>
    </div>
  );
}
