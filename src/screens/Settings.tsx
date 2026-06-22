import { useStore } from '../store';
import { audioService } from '../audio/AudioService';
import { ROBOT_PARTS } from '../reward/robotParts';
import { BigButton } from '../ui/BigButton';
import './Settings.css';

export function Settings() {
  const robotName = useStore((s) => s.robotName);
  const setRobotName = useStore((s) => s.setRobotName);
  const ttsVoiceUri = useStore((s) => s.ttsVoiceUri);
  const setTtsVoiceUri = useStore((s) => s.setTtsVoiceUri);
  const resetProgress = useStore((s) => s.resetProgress);
  const setScreen = useStore((s) => s.setScreen);
  const progress = useStore((s) => s.progress);

  const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : [];
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));

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

      <label className="settings__field">
        TTS backend
        <select
          value={audioService.getTtsBackend()}
          onChange={(e) =>
            audioService.setTtsBackend(e.target.value as 'webspeech' | 'remote')
          }
        >
          <option value="webspeech">Web Speech (default)</option>
          <option value="remote">Remote (not configured)</option>
        </select>
      </label>

      <div className="settings__stats">
        <p>Stars: {progress.stars}</p>
        <p>Lessons completed: {progress.completedLessonIds.length}</p>
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
