export type Phoneme = string;

export interface LessonContent {
  id: string;
  title: string;
  newSounds: Phoneme[];
  reviewSounds: Phoneme[];
  targetWords: string[];
  sightWords: string[];
}

export type ActivityType =
  | 'LISTEN_SOUND'
  | 'PICK_SOUND'
  | 'TRACE'
  | 'BLEND'
  | 'BUILD_WORD'
  | 'SIGHT_WORD'
  | 'REVIEW_GAME';

export interface Activity {
  type: ActivityType;
  sound?: Phoneme;
  choices?: Phoneme[];
  word?: string;
  tiles?: Phoneme[];
  sightWord?: string;
  reviewPool?: (Phoneme | string)[];
  wholeWordClipOnly?: boolean;
}

export interface Progress {
  completedLessonIds: string[];
  stars: number;
  unlockedPartIds: string[];
  equipped: Record<string, string>;
  lastLessonId: string | null;
}

export type Screen =
  | 'boot'
  | 'home'
  | 'lesson'
  | 'reward'
  | 'parent_gate'
  | 'settings';

export type AvatarState = 'idle' | 'talking' | 'celebrate' | 'encourage' | 'thinking';
