import type { LessonContent } from './types';
import { LESSONS } from './lessons';

export function clipKeyForSound(phoneme: string): string {
  return `sound_${phoneme}`;
}

export function clipKeyForWord(word: string): string {
  return `word_${word}`;
}

export function clipKeyForSight(word: string): string {
  return `sight_${word}`;
}

export function clipKeyForBlend(word: string): string {
  return `blend_${word}`;
}

export function getRequiredClipKeys(lessons: LessonContent[]): string[] {
  const keys = new Set<string>();

  for (const lesson of lessons) {
    for (const s of [...lesson.newSounds, ...lesson.reviewSounds]) {
      keys.add(clipKeyForSound(s));
    }
    for (const w of lesson.targetWords) {
      keys.add(clipKeyForWord(w));
      keys.add(clipKeyForBlend(w));
      for (const ch of w) {
        keys.add(clipKeyForSound(ch));
      }
    }
    for (const w of lesson.sightWords) {
      keys.add(clipKeyForSight(w));
    }
  }

  return [...keys].sort();
}

export const ALL_REQUIRED_CLIP_KEYS = getRequiredClipKeys(LESSONS);

export async function checkMissingClips(keys: string[] = ALL_REQUIRED_CLIP_KEYS): Promise<string[]> {
  const missing: string[] = [];
  await Promise.all(
    keys.map(async (key) => {
      try {
        const res = await fetch(`/audio/${key}.mp3`, { method: 'HEAD' });
        if (!res.ok) missing.push(key);
      } catch {
        missing.push(key);
      }
    }),
  );
  return missing;
}

export function warnMissingClipsOnLoad(): void {
  if (import.meta.env.PROD) return;
  void checkMissingClips().then((missing) => {
    if (missing.length > 0) {
      console.warn(
        '[Reading Buddy] Missing audio clips (%d). Record these files in public/audio/:',
        missing.length,
        missing,
      );
    }
  });
}
