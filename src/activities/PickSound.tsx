import { useCallback, useMemo, useRef, useState } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { shuffle } from '../utils/wordEmoji';
import { RepeatButton, useActivityInstruction, useGentleWrong } from './activityUtils';

interface PickSoundProps {
  sound: string;
  choices: string[];
  onSuccess: () => void;
}

export function PickSound({ sound, choices, onSuccess }: PickSoundProps) {
  const shuffled = useMemo(() => shuffle(choices), [choices]);
  const [wrongCount, setWrongCount] = useState(0);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const activeRef = useRef(false);
  const onGentleWrong = useGentleWrong();

  const playPrompt = useCallback(async () => {
    audioService.speakText(INSTRUCTIONS.tapLetterThatSays);
    await new Promise((r) => setTimeout(r, 1500));
    await audioService.speakClip(`sound_${sound}`);
  }, [sound]);

  useActivityInstruction(playPrompt);

  const handlePointerUp = useCallback(
    (choice: string) => {
      if (!activeRef.current) return;
      activeRef.current = false;
      setPressed(null);

      if (choice === sound) {
        onSuccess();
        return;
      }

      setShaking(choice);
      setTimeout(() => setShaking(null), 400);
      onGentleWrong();
      void audioService.speakClip(`sound_${sound}`);

      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      if (nextWrong >= 2) {
        setHighlightCorrect(true);
      }
    },
    [sound, wrongCount, onGentleWrong, onSuccess],
  );

  return (
    <>
      <div className="activity-tiles">
        {shuffled.map((choice) => (
          <button
            key={choice}
            type="button"
            className={`activity-tile ${pressed === choice ? 'activity-tile--pressed' : ''} ${shaking === choice ? 'activity-tile--shake' : ''} ${highlightCorrect && choice === sound ? 'activity-tile--highlight' : ''}`}
            aria-label={`Letter ${choice}`}
            onPointerDown={() => {
              activeRef.current = true;
              setPressed(choice);
            }}
            onPointerUp={() => handlePointerUp(choice)}
            onPointerCancel={() => {
              activeRef.current = false;
              setPressed(null);
            }}
            onPointerLeave={() => {
              activeRef.current = false;
              setPressed(null);
            }}
          >
            {choice}
          </button>
        ))}
      </div>
      <RepeatButton onRepeat={playPrompt} />
    </>
  );
}
