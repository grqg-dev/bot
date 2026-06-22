import { useCallback } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { BigButton } from '../ui/BigButton';
import { RepeatButton, useActivityInstruction } from './activityUtils';

interface ListenSoundProps {
  sound: string;
  onSuccess: () => void;
}

export function ListenSound({ sound, onSuccess }: ListenSoundProps) {
  const playSound = useCallback(async () => {
    audioService.speakText(INSTRUCTIONS.thisLetterSays);
    await new Promise((r) => setTimeout(r, 1200));
    await audioService.speakClip(`sound_${sound}`);
  }, [sound]);

  useActivityInstruction(playSound);

  const replay = useCallback(() => {
    void audioService.speakClip(`sound_${sound}`);
  }, [sound]);

  return (
    <>
      <div className="activity-letter" aria-hidden="true">
        {sound}
      </div>
      <BigButton className="activity-next-btn" onPress={replay} ariaLabel="Play sound">
        🔊
      </BigButton>
      <BigButton className="activity-next-btn" onPress={onSuccess} ariaLabel="Continue">
        ✅
      </BigButton>
      <RepeatButton onRepeat={playSound} />
    </>
  );
}
