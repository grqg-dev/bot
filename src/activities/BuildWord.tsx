import { useCallback, useMemo, useState } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { shuffle, wordEmoji } from '../utils/wordEmoji';
import { RepeatButton, useActivityInstruction } from './activityUtils';

interface BuildWordProps {
  word: string;
  tiles: string[];
  onSuccess: () => void;
}

export function BuildWord({ word, tiles, onSuccess }: BuildWordProps) {
  const letters = [...word];
  const shuffledTiles = useMemo(() => shuffle(tiles), [tiles]);
  const [slots, setSlots] = useState<(string | null)[]>(Array(letters.length).fill(null));
  const [available, setAvailable] = useState(() => shuffledTiles.map((t, i) => ({ t, id: i, used: false })));
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [bouncing, setBouncing] = useState<number | null>(null);

  const speak = useCallback(() => {
    audioService.speakText(INSTRUCTIONS.buildTheWord);
  }, []);

  useActivityInstruction(speak);

  const checkComplete = useCallback(
    async (newSlots: (string | null)[]) => {
      if (newSlots.every((s, i) => s === letters[i])) {
        await audioService.speakClip(`word_${word}`);
        onSuccess();
      }
    },
    [letters, word, onSuccess],
  );

  const placeInSlot = useCallback(
    async (slotIdx: number, tileId: number, tile: string) => {
      if (slots[slotIdx]) return;

      if (tile === letters[slotIdx]) {
        const newSlots = [...slots];
        newSlots[slotIdx] = tile;
        setSlots(newSlots);
        setAvailable((prev) =>
          prev.map((a) => (a.id === tileId ? { ...a, used: true } : a)),
        );
        setSelectedTile(null);
        await audioService.speakClip(`sound_${tile}`);
        void checkComplete(newSlots);
      } else {
        setBouncing(slotIdx);
        setTimeout(() => setBouncing(null), 400);
        setSelectedTile(null);
      }
    },
    [slots, letters, checkComplete],
  );

  const handleTileTap = (tileId: number) => {
    const item = available.find((a) => a.id === tileId);
    if (!item || item.used) return;
    setSelectedTile(tileId === selectedTile ? null : tileId);
  };

  const handleSlotTap = (slotIdx: number) => {
    if (selectedTile === null) return;
    const item = available.find((a) => a.id === selectedTile);
    if (!item || item.used) return;
    void placeInSlot(slotIdx, item.id, item.t);
  };

  return (
    <>
      <div className="word-picture" aria-hidden="true">
        {wordEmoji(word)}
      </div>
      <div className="build-slots">
        {slots.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`build-slot ${s ? 'build-slot--filled' : ''} ${bouncing === i ? 'activity-tile--shake' : ''}`}
            onPointerUp={() => handleSlotTap(i)}
            aria-label={`Slot ${i + 1}`}
          >
            {s ?? ''}
          </button>
        ))}
      </div>
      <div className="activity-tiles">
        {available
          .filter((a) => !a.used)
          .map((a) => (
            <button
              key={a.id}
              type="button"
              className={`activity-tile ${selectedTile === a.id ? 'activity-tile--pressed' : ''}`}
              onPointerUp={() => handleTileTap(a.id)}
              aria-label={`Tile ${a.t}`}
            >
              {a.t}
            </button>
          ))}
      </div>
      <RepeatButton onRepeat={speak} />
    </>
  );
}
