import { useCallback, useState } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { wordEmoji } from '../utils/wordEmoji';
import { BigButton } from '../ui/BigButton';
import { RepeatButton, useActivityInstruction } from './activityUtils';

interface BlendProps {
  word: string;
  wholeWordClipOnly?: boolean;
  onSuccess: () => void;
}

export function Blend({ word, wholeWordClipOnly, onSuccess }: BlendProps) {
  const [blended, setBlended] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const letters = [...word];

  const speak = useCallback(() => {
    audioService.speakText(INSTRUCTIONS.blendTheSounds);
  }, []);

  useActivityInstruction(speak);

  const tapTile = useCallback(
    async (idx: number, letter: string) => {
      if (wholeWordClipOnly) return;
      setActiveTile(idx);
      await audioService.speakClip(`sound_${letter}`);
      setTimeout(() => setActiveTile(null), 400);
    },
    [wholeWordClipOnly],
  );

  const doBlend = useCallback(async () => {
    await audioService.speakBlend(word);
    setBlended(true);
    await audioService.speakClip(`word_${word}`);
    setTimeout(onSuccess, 800);
  }, [word, onSuccess]);

  if (wholeWordClipOnly) {
    return (
      <>
        <div className="word-picture" aria-hidden="true">
          {wordEmoji(word)}
        </div>
        <BigButton onPress={doBlend} ariaLabel="Blend word">
          🎵
        </BigButton>
        <RepeatButton onRepeat={speak} />
      </>
    );
  }

  return (
    <>
      <div className="blend-tiles">
        {letters.map((letter, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className={`activity-tile ${activeTile === i ? 'activity-tile--pressed' : ''}`}
              onPointerUp={() => void tapTile(i, letter)}
              aria-label={`Sound ${letter}`}
            >
              {letter}
            </button>
            {i < letters.length - 1 && <span className="blend-separator">·</span>}
          </span>
        ))}
      </div>
      {blended ? (
        <div className="word-picture" aria-hidden="true">
          {wordEmoji(word)}
        </div>
      ) : (
        <BigButton onPress={doBlend} ariaLabel="Blend sounds">
          🎵
        </BigButton>
      )}
      <RepeatButton onRepeat={speak} />
    </>
  );
}
