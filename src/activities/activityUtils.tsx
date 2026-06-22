import { useEffect, useRef, useCallback } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { BigButton } from '../ui/BigButton';
import { useStore } from '../store';

interface RepeatButtonProps {
  onRepeat: () => void;
}

export function RepeatButton({ onRepeat }: RepeatButtonProps) {
  return (
    <BigButton className="repeat-btn" onPress={onRepeat} ariaLabel="Repeat instruction">
      🔊
    </BigButton>
  );
}

export function useActivityInstruction(speak: () => void) {
  const spoke = useRef(false);

  useEffect(() => {
    if (!spoke.current) {
      spoke.current = true;
      const t = setTimeout(speak, 400);
      return () => clearTimeout(t);
    }
  }, [speak]);
}

export function useGentleWrong() {
  const setAvatarState = useStore((s) => s.setAvatarState);

  return useCallback(() => {
    setAvatarState('encourage');
    audioService.speakText(INSTRUCTIONS.tryAgain);
    setTimeout(() => setAvatarState('idle'), 1500);
  }, [setAvatarState]);
}
