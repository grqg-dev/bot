import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { shuffle } from '../utils/wordEmoji';
import { RepeatButton, useActivityInstruction, useGentleWrong } from './activityUtils';

interface ReviewGameProps {
  reviewPool: (string)[];
  onSuccess: () => void;
}

interface Round {
  prompt: string;
  correct: string;
  choices: string[];
  clipKey: string;
}

function buildRounds(pool: string[]): Round[] {
  const items = pool.slice(0, 4);
  return items.map((correct) => {
    const others = pool.filter((p) => p !== correct).slice(0, 2);
    const choices = shuffle([correct, ...others]);
    const isSight = correct.length > 1 || !/^[a-z]$/.test(correct);
    const clipKey = isSight
      ? `sight_${correct}`
      : correct.length === 1
        ? `sound_${correct}`
        : `word_${correct}`;
    return {
      prompt: correct,
      correct,
      choices,
      clipKey,
    };
  });
}

export function ReviewGame({ reviewPool, onSuccess }: ReviewGameProps) {
  const rounds = useMemo(() => buildRounds(reviewPool), [reviewPool]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const activeRef = useRef(false);
  const onGentleWrong = useGentleWrong();

  const round = rounds[roundIdx];

  const speakRound = useCallback(async () => {
    if (!round) return;
    audioService.speakText(INSTRUCTIONS.reviewTap);
    await new Promise((r) => setTimeout(r, 1200));
    await audioService.speakClip(round.clipKey);
  }, [round]);

  useActivityInstruction(speakRound);

  useEffect(() => {
    if (roundIdx > 0) {
      void speakRound();
    }
  }, [roundIdx, speakRound]);

  const handleTap = useCallback(
    (choice: string) => {
      if (!activeRef.current || !round) return;
      activeRef.current = false;
      setPressed(null);

      if (choice === round.correct) {
        if (roundIdx + 1 >= rounds.length) {
          onSuccess();
        } else {
          setRoundIdx((i) => i + 1);
          setWrongCount(0);
          setHighlightCorrect(false);
        }
        return;
      }

      setShaking(choice);
      setTimeout(() => setShaking(null), 400);
      onGentleWrong();
      void audioService.speakClip(round.clipKey);

      const next = wrongCount + 1;
      setWrongCount(next);
      if (next >= 2) setHighlightCorrect(true);
    },
    [round, roundIdx, rounds.length, wrongCount, onGentleWrong, onSuccess],
  );

  if (!round) return null;

  const isLetter = round.correct.length === 1;

  return (
    <>
      <div className="activity-tiles">
        {round.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={`activity-tile ${pressed === choice ? 'activity-tile--pressed' : ''} ${shaking === choice ? 'activity-tile--shake' : ''} ${highlightCorrect && choice === round.correct ? 'activity-tile--highlight' : ''}`}
            style={!isLetter ? { fontSize: '2rem' } : undefined}
            aria-label="Choice"
            onPointerDown={() => {
              activeRef.current = true;
              setPressed(choice);
            }}
            onPointerUp={() => handleTap(choice)}
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
      <RepeatButton onRepeat={speakRound} />
    </>
  );
}
