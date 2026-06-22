import { useCallback, useMemo, useRef, useState } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { LESSONS } from '../curriculum/lessons';
import { shuffle } from '../utils/wordEmoji';
import { RepeatButton, useActivityInstruction, useGentleWrong } from './activityUtils';

interface SightWordProps {
  sightWord: string;
  onSuccess: () => void;
}

function getAllSightWords(): string[] {
  const set = new Set<string>();
  for (const l of LESSONS) {
    for (const w of l.sightWords) set.add(w);
  }
  return [...set];
}

export function SightWord({ sightWord, onSuccess }: SightWordProps) {
  const [phase, setPhase] = useState<'learn' | 'find'>('learn');
  const [wrongCount, setWrongCount] = useState(0);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const activeRef = useRef(false);
  const onGentleWrong = useGentleWrong();

  const decoys = useMemo(() => {
    const all = getAllSightWords().filter((w) => w !== sightWord);
    return shuffle(all).slice(0, 2);
  }, [sightWord]);

  const choices = useMemo(
    () => shuffle([sightWord, ...decoys]),
    [sightWord, decoys],
  );

  const teach = useCallback(async () => {
    audioService.speakText(INSTRUCTIONS.thisWordIs);
    await new Promise((r) => setTimeout(r, 1200));
    await audioService.speakClip(`sight_${sightWord}`);
    setTimeout(() => {
      audioService.speakText(INSTRUCTIONS.findIt);
      setPhase('find');
    }, 1500);
  }, [sightWord]);

  useActivityInstruction(teach);

  const handleFindTap = useCallback(
    (choice: string) => {
      if (!activeRef.current) return;
      activeRef.current = false;
      setPressed(null);

      if (choice === sightWord) {
        onSuccess();
        return;
      }

      setShaking(choice);
      setTimeout(() => setShaking(null), 400);
      onGentleWrong();
      void audioService.speakClip(`sight_${sightWord}`);

      const next = wrongCount + 1;
      setWrongCount(next);
      if (next >= 2) setHighlightCorrect(true);
    },
    [sightWord, wrongCount, onGentleWrong, onSuccess],
  );

  if (phase === 'learn') {
    return (
      <>
        <div className="sight-word-display" aria-hidden="true">
          {sightWord}
        </div>
        <RepeatButton onRepeat={teach} />
      </>
    );
  }

  return (
    <>
      <div className="activity-tiles">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={`activity-tile ${pressed === choice ? 'activity-tile--pressed' : ''} ${shaking === choice ? 'activity-tile--shake' : ''} ${highlightCorrect && choice === sightWord ? 'activity-tile--highlight' : ''}`}
            style={{ fontSize: '2rem', minWidth: 120, minHeight: 120 }}
            aria-label="Word choice"
            onPointerDown={() => {
              activeRef.current = true;
              setPressed(choice);
            }}
            onPointerUp={() => handleFindTap(choice)}
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
      <RepeatButton onRepeat={teach} />
    </>
  );
}
