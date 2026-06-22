import { create } from 'zustand';
import type { Activity, AvatarState, Progress, Screen } from './curriculum/types';
import { LESSONS } from './curriculum/lessons';
import { buildActivities } from './curriculum/buildActivities';
import { audioService } from './audio/AudioService';
import {
  computeUnlockedParts,
  getDefaultEquipped,
  ROBOT_PARTS,
} from './reward/robotParts';

const STORAGE_KEY = 'reading_buddy_progress_v1';

const defaultProgress: Progress = {
  completedLessonIds: [],
  stars: 0,
  unlockedPartIds: computeUnlockedParts(0),
  equipped: getDefaultEquipped(),
  lastLessonId: null,
};

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };
    const parsed = JSON.parse(raw) as Progress;
    return {
      ...defaultProgress,
      ...parsed,
      unlockedPartIds: computeUnlockedParts(parsed.stars ?? 0),
      equipped: { ...getDefaultEquipped(), ...parsed.equipped },
    };
  } catch {
    return { ...defaultProgress };
  }
}

function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

interface LessonSession {
  lessonId: string;
  activities: Activity[];
  currentIndex: number;
  starsEarnedThisLesson: number;
  newlyUnlockedParts: string[];
}

interface AppState {
  screen: Screen;
  progress: Progress;
  avatarState: AvatarState;
  robotName: string;
  ttsVoiceUri: string | null;
  audioUnlocked: boolean;
  lessonSession: LessonSession | null;
  parentGateTarget: 'settings' | 'pause' | null;
  lastEquippedShown: string[];

  unlockAudio: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  setAvatarState: (state: AvatarState) => void;
  setRobotName: (name: string) => void;
  setTtsVoiceUri: (uri: string | null) => void;
  setParentGateTarget: (target: 'settings' | 'pause' | null) => void;

  startLesson: (lessonId: string) => void;
  completeActivity: () => void;
  finishLesson: () => void;
  equipPart: (partId: string) => void;
  resetProgress: () => void;

  getNextLessonId: () => string | null;
  isLessonUnlocked: (lessonId: string) => boolean;
  isLessonComplete: (lessonId: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  screen: 'boot',
  progress: loadProgress(),
  avatarState: 'idle',
  robotName: 'Beep',
  ttsVoiceUri: null,
  audioUnlocked: false,
  lessonSession: null,
  parentGateTarget: null,
  lastEquippedShown: [],

  unlockAudio: async () => {
    await audioService.unlock();
    set({ audioUnlocked: true, screen: 'home' });
  },

  setScreen: (screen) => set({ screen }),

  setAvatarState: (avatarState) => set({ avatarState }),

  setRobotName: (robotName) => set({ robotName }),

  setTtsVoiceUri: (ttsVoiceUri) => {
    audioService.setPreferredVoiceUri(ttsVoiceUri);
    set({ ttsVoiceUri });
  },

  setParentGateTarget: (parentGateTarget) => set({ parentGateTarget }),

  getNextLessonId: () => {
    const { progress } = get();
    for (const lesson of LESSONS) {
      if (!progress.completedLessonIds.includes(lesson.id)) {
        return lesson.id;
      }
    }
    return null;
  },

  isLessonUnlocked: (lessonId) => {
    const idx = LESSONS.findIndex((l) => l.id === lessonId);
    if (idx === 0) return true;
    const prev = LESSONS[idx - 1];
    return get().progress.completedLessonIds.includes(prev.id);
  },

  isLessonComplete: (lessonId) => get().progress.completedLessonIds.includes(lessonId),

  startLesson: (lessonId) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    if (!lesson) return;
    const activities = buildActivities(lesson);
    set({
      screen: 'lesson',
      lessonSession: {
        lessonId,
        activities,
        currentIndex: 0,
        starsEarnedThisLesson: 0,
        newlyUnlockedParts: [],
      },
      progress: { ...get().progress, lastLessonId: lessonId },
    });
  },

  completeActivity: () => {
    const { lessonSession, progress } = get();
    if (!lessonSession) return;

    const prevUnlocked = new Set(progress.unlockedPartIds);
    const newStars = progress.stars + 1;
    const unlockedPartIds = computeUnlockedParts(newStars);
    const newlyUnlocked = unlockedPartIds.filter((id) => !prevUnlocked.has(id));

    const updatedSession: LessonSession = {
      ...lessonSession,
      currentIndex: lessonSession.currentIndex + 1,
      starsEarnedThisLesson: lessonSession.starsEarnedThisLesson + 1,
      newlyUnlockedParts: [
        ...lessonSession.newlyUnlockedParts,
        ...newlyUnlocked,
      ],
    };

    const newProgress = {
      ...progress,
      stars: newStars,
      unlockedPartIds,
    };
    saveProgress(newProgress);

    if (updatedSession.currentIndex >= updatedSession.activities.length) {
      const bonusStars = 3;
      const finalStars = newProgress.stars + bonusStars;
      const finalUnlocked = computeUnlockedParts(finalStars);
      const bonusNewParts = finalUnlocked.filter((id) => !new Set(newProgress.unlockedPartIds).has(id));
      const completedLessonIds = [...newProgress.completedLessonIds];
      if (!completedLessonIds.includes(lessonSession.lessonId)) {
        completedLessonIds.push(lessonSession.lessonId);
      }
      const finalProgress = {
        ...newProgress,
        stars: finalStars,
        unlockedPartIds: finalUnlocked,
        completedLessonIds,
      };
      saveProgress(finalProgress);
      set({
        progress: finalProgress,
        lessonSession: {
          ...updatedSession,
          starsEarnedThisLesson: updatedSession.starsEarnedThisLesson + bonusStars,
          newlyUnlockedParts: [...updatedSession.newlyUnlockedParts, ...bonusNewParts],
        },
        screen: 'reward',
      });
    } else {
      set({ progress: newProgress, lessonSession: updatedSession });
    }
  },

  finishLesson: () => {
    set({ screen: 'home', lessonSession: null });
  },

  equipPart: (partId) => {
    const part = ROBOT_PARTS.find((p) => p.id === partId);
    if (!part) return;
    const { progress } = get();
    if (!progress.unlockedPartIds.includes(partId)) return;
    const equipped = { ...progress.equipped, [part.slot]: partId };
    const newProgress = { ...progress, equipped };
    saveProgress(newProgress);
    set({ progress: newProgress });
  },

  resetProgress: () => {
    const fresh = { ...defaultProgress };
    saveProgress(fresh);
    set({ progress: fresh, lessonSession: null, screen: 'home' });
  },
}));

audioService.onPlayStateChange((playing) => {
  const current = useStore.getState().avatarState;
  if (playing) {
    if (current !== 'celebrate' && current !== 'encourage') {
      useStore.getState().setAvatarState('talking');
    }
  } else if (current === 'talking') {
    useStore.getState().setAvatarState('idle');
  }
});
