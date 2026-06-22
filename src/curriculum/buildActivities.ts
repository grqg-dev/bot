import type { Activity, LessonContent, Phoneme } from './types';

function pick2(pool: Phoneme[]): Phoneme[] {
  const seen = new Set<Phoneme>();
  const result: Phoneme[] = [];
  for (const item of pool) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
      if (result.length === 2) break;
    }
  }
  return result;
}

function knownSounds(lesson: LessonContent): Set<Phoneme> {
  return new Set([...lesson.newSounds, ...lesson.reviewSounds]);
}

function isFullyDecodable(word: string, known: Set<Phoneme>): boolean {
  return [...word].every((ch) => known.has(ch));
}

function uniqueLettersOf(word: string): Phoneme[] {
  const seen = new Set<Phoneme>();
  const result: Phoneme[] = [];
  for (const ch of word) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result.push(ch);
    }
  }
  return result;
}

type TaggedActivity = Activity & { _tag?: string };

function tag(activity: Activity, tagName: string): TaggedActivity {
  return { ...activity, _tag: tagName };
}

export function buildActivities(lesson: LessonContent): Activity[] {
  const known = knownSounds(lesson);
  const activities: TaggedActivity[] = [];

  // Step A — introduce new sounds
  for (const s of lesson.newSounds) {
    activities.push(tag({ type: 'LISTEN_SOUND', sound: s }, 'A'));
  }

  // Step B — practice
  for (const s of lesson.newSounds) {
    activities.push(tag({ type: 'TRACE', sound: s }, 'B-trace'));
  }

  for (const s of lesson.newSounds) {
    const pool = [...lesson.reviewSounds, ...lesson.newSounds].filter((x) => x !== s);
    activities.push(
      tag(
        { type: 'PICK_SOUND', sound: s, choices: [s, ...pick2(pool)] },
        'B-pick',
      ),
    );
  }

  const decodableWords = lesson.targetWords.filter((w) => isFullyDecodable(w, known));
  let wholeWordUsed = false;

  const blendWords: { word: string; wholeWordClipOnly?: boolean }[] = [];
  for (const w of lesson.targetWords) {
    if (blendWords.length >= 2) break;
    if (isFullyDecodable(w, known)) {
      blendWords.push({ word: w });
    } else if (!wholeWordUsed) {
      blendWords.push({ word: w, wholeWordClipOnly: true });
      wholeWordUsed = true;
    }
  }

  const blendLimit = Math.min(2, lesson.targetWords.length);
  const finalBlends = blendWords.slice(0, blendLimit);
  for (const { word, wholeWordClipOnly } of finalBlends) {
    activities.push(
      tag({ type: 'BLEND', word, wholeWordClipOnly }, 'B-blend'),
    );
  }

  if (decodableWords.length >= 1) {
    const firstDecodable = decodableWords[0];
    const reviewExtras = lesson.reviewSounds.slice(0, 2);
    activities.push(
      tag(
        {
          type: 'BUILD_WORD',
          word: firstDecodable,
          tiles: [...uniqueLettersOf(firstDecodable), ...reviewExtras],
        },
        'B-build',
      ),
    );
  }

  // Step C — sight words
  for (const w of lesson.sightWords) {
    activities.push(tag({ type: 'SIGHT_WORD', sightWord: w }, 'C'));
  }

  // Step D — review game
  activities.push(
    tag(
      {
        type: 'REVIEW_GAME',
        reviewPool: [
          ...lesson.newSounds,
          ...lesson.targetWords.slice(0, 3),
          ...lesson.sightWords,
        ],
      },
      'D',
    ),
  );

  // Step E — cap at 7
  if (activities.length <= 7) {
    return activities.map(({ _tag, ...rest }) => rest);
  }

  const firstOfEach: TaggedActivity[] = [];
  const seenTags = new Set<string>();
  for (const a of activities) {
    const t = a._tag ?? '';
    if (!seenTags.has(t)) {
      seenTags.add(t);
      firstOfEach.push(a);
    }
  }

  const priority = ['A', 'C', 'B-blend', 'B-pick', 'B-trace', 'D'];
  const kept = new Set(firstOfEach);
  let result = [...firstOfEach];

  if (result.length > 7) {
    const dropOrder = [...priority].reverse();
    for (const tagName of dropOrder) {
      if (result.length <= 7) break;
      const tagged = result.filter((a) => a._tag === tagName);
      for (let i = tagged.length - 1; i >= 0 && result.length > 7; i--) {
        if (kept.has(tagged[i]) && tagged.length > 1) {
          kept.delete(tagged[i]);
          result = result.filter((a) => a !== tagged[i]);
        }
      }
    }
  }

  if (result.length < 7) {
    const remaining = activities.filter((a) => !kept.has(a));
    const fillPriority = ['A', 'C', 'B-blend', 'B-pick', 'B-trace', 'D'];
    for (const tagName of fillPriority) {
      for (const a of remaining) {
        if (result.length >= 7) break;
        if (a._tag === tagName && !kept.has(a)) {
          kept.add(a);
          result.push(a);
        }
      }
    }
  }

  result.sort((a, b) => activities.indexOf(a) - activities.indexOf(b));
  return result.slice(0, 7).map(({ _tag, ...rest }) => rest);
}
