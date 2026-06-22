import { useCallback, useEffect, useState } from 'react';
import { useStore } from './store';
import { audioService } from './audio/AudioService';
import { INSTRUCTIONS } from './audio/instructions';
import { warnMissingClipsOnLoad } from './curriculum/audioManifest';
import { AVATAR_STATES, AVATAR_STATE_LABELS } from './avatar/avatarStates';
import { HomeMap } from './screens/HomeMap';
import { LessonRunner } from './screens/LessonRunner';
import { RewardScreen } from './screens/RewardScreen';
import { ParentGate } from './screens/ParentGate';
import { Settings } from './screens/Settings';
import { RobotScene } from './avatar/RobotScene';
import { BigButton } from './ui/BigButton';
import './styles/global.css';

function usePortraitBlock() {
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const check = () => {
      setPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return portrait;
}

function BootScreen() {
  const unlockAudio = useStore((s) => s.unlockAudio);

  const handleStart = useCallback(async () => {
    await unlockAudio();
    audioService.speakText(INSTRUCTIONS.tapToStart);
  }, [unlockAudio]);

  return (
    <div className="boot-screen">
      <div className="boot-screen__robot">
        <RobotScene />
      </div>
      <BigButton className="boot-screen__start" onPress={handleStart} ariaLabel="Start">
        ▶️
      </BigButton>
    </div>
  );
}

function DevControls() {
  const avatarState = useStore((s) => s.avatarState);
  const setAvatarState = useStore((s) => s.setAvatarState);

  if (import.meta.env.PROD) return null;

  return (
    <div className="dev-controls parent-only">
      <span>Dev:</span>
      {AVATAR_STATES.map((state) => (
        <button
          key={state}
          type="button"
          className={avatarState === state ? 'dev-controls__active' : ''}
          onClick={() => {
            setAvatarState(state);
            if (state === 'talking') {
              audioService.speakText('Hello! I am your reading buddy.');
            }
          }}
        >
          {AVATAR_STATE_LABELS[state]}
        </button>
      ))}
    </div>
  );
}

function PortraitWarning() {
  return (
    <div className="portrait-warning">
      <div className="portrait-warning__icon">📱↔️</div>
      <p className="parent-only">{INSTRUCTIONS.turnSideways}</p>
    </div>
  );
}

export default function App() {
  const screen = useStore((s) => s.screen);
  const portrait = usePortraitBlock();

  useEffect(() => {
    warnMissingClipsOnLoad();

    const preventGesture = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);

    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', preventDoubleTap, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchend', preventDoubleTap);
    };
  }, []);

  if (portrait) return <PortraitWarning />;

  return (
    <div className="app">
      <DevControls />
      {screen === 'boot' && <BootScreen />}
      {screen === 'home' && <HomeMap />}
      {screen === 'lesson' && <LessonRunner />}
      {screen === 'reward' && <RewardScreen />}
      {screen === 'parent_gate' && <ParentGate />}
      {screen === 'settings' && <Settings />}
    </div>
  );
}
