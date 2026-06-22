/**
 * Lesson data for audio generation scripts (mirrors src/curriculum/lessons.ts).
 */
export const LESSONS = [
  { id: 'L01', newSounds: ['s', 'a', 't', 'p'], reviewSounds: [], targetWords: ['at', 'sat', 'pat', 'tap'], sightWords: ['I'] },
  { id: 'L02', newSounds: ['i', 'n'], reviewSounds: ['s', 'a', 't', 'p'], targetWords: ['sit', 'tin', 'nip', 'pin', 'tap'], sightWords: ['a'] },
  { id: 'L03', newSounds: ['m', 'd'], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n'], targetWords: ['mat', 'man', 'mad', 'dad', 'dip', 'sad'], sightWords: ['the'] },
  { id: 'L04', newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'], targetWords: ['map', 'nap', 'sip', 'dim', 'pad'], sightWords: ['to', 'see'] },
  { id: 'L05', newSounds: ['g', 'o'], reviewSounds: ['s', 'a', 't', 'i', 'n', 'm', 'd', 'p'], targetWords: ['got', 'dog', 'dot', 'top', 'pot', 'gas'], sightWords: ['go'] },
  { id: 'L06', newSounds: ['c', 'k'], reviewSounds: ['a', 't', 'i', 'n', 'o', 'g', 'd', 'p'], targetWords: ['cat', 'can', 'cot', 'kit', 'kid', 'cap'], sightWords: ['my'] },
  { id: 'L07', newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k'], targetWords: ['dog', 'cat', 'pig', 'sock', 'tap', 'man'], sightWords: ['and'] },
  { id: 'L08', newSounds: ['e', 'u'], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k'], targetWords: ['pet', 'net', 'bed', 'cup', 'mud', 'sun'], sightWords: ['is'] },
  { id: 'L09', newSounds: ['r', 'h'], reviewSounds: ['a', 'e', 'i', 'o', 'u', 't', 'p', 'n', 'm', 'd', 'c', 'g'], targetWords: ['run', 'rat', 'red', 'hat', 'hot', 'hen'], sightWords: ['it'] },
  { id: 'L10', newSounds: ['b', 'f', 'l'], reviewSounds: ['a', 'e', 'i', 'o', 'u', 'r', 'h', 't', 'n', 'm', 'd'], targetWords: ['bat', 'bus', 'fan', 'fun', 'log', 'lip'], sightWords: ['up', 'we'] },
  { id: 'L11', newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'], targetWords: ['fish', 'dog', 'sun', 'cat', 'bed', 'run'], sightWords: ['look', 'here'] },
  { id: 'L12', newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'], targetWords: ['cat', 'sat', 'mat', 'dog', 'ran'], sightWords: ['the', 'a', 'I', 'can', 'see'] },
];

export function getRequiredClipKeys(lessons = LESSONS) {
  const keys = new Set();
  for (const lesson of lessons) {
    for (const s of [...lesson.newSounds, ...lesson.reviewSounds]) {
      keys.add(`sound_${s}`);
    }
    for (const w of lesson.targetWords) {
      keys.add(`word_${w}`);
      keys.add(`blend_${w}`);
      for (const ch of w) keys.add(`sound_${ch}`);
    }
    for (const w of lesson.sightWords) {
      keys.add(`sight_${w}`);
    }
  }
  return [...keys].sort();
}
