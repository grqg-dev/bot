import { useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { LESSONS } from '../curriculum/lessons';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { RobotScene } from '../avatar/RobotScene';
import { BigButton } from '../ui/BigButton';
import './HomeMap.css';

export function HomeMap() {
  const progress = useStore((s) => s.progress);
  const startLesson = useStore((s) => s.startLesson);
  const isLessonUnlocked = useStore((s) => s.isLessonUnlocked);
  const isLessonComplete = useStore((s) => s.isLessonComplete);
  const getNextLessonId = useStore((s) => s.getNextLessonId);
  const setScreen = useStore((s) => s.setScreen);
  const setParentGateTarget = useStore((s) => s.setParentGateTarget);

  const nextId = getNextLessonId();

  const greet = useCallback(() => {
    audioService.speakText(INSTRUCTIONS.tapHereToPlay);
  }, []);

  useEffect(() => {
    const t = setTimeout(greet, 600);
    return () => clearTimeout(t);
  }, [greet]);

  return (
    <div className="home-map">
      <div className="home-map__header">
        <div className="home-map__stars" aria-label={`${progress.stars} stars`}>
          ⭐ {progress.stars}
        </div>
        <BigButton
          className="home-map__gear"
          onPress={() => {
            setParentGateTarget('settings');
            setScreen('parent_gate');
          }}
          ariaLabel="Parent settings"
        >
          ⚙️
        </BigButton>
      </div>

      <div className="home-map__main">
        <div className="home-map__robot">
          <RobotScene />
        </div>
        <div className="home-map__path">
          {LESSONS.map((lesson, i) => {
            const unlocked = isLessonUnlocked(lesson.id);
            const complete = isLessonComplete(lesson.id);
            const isNext = lesson.id === nextId;
            return (
              <button
                key={lesson.id}
                type="button"
                className={`home-map__node ${unlocked ? '' : 'home-map__node--locked'} ${complete ? 'home-map__node--complete' : ''} ${isNext ? 'home-map__node--next' : ''}`}
                disabled={!unlocked}
                onPointerUp={() => {
                  if (unlocked) startLesson(lesson.id);
                }}
                aria-label={`Lesson ${i + 1}`}
                style={{ '--i': i } as React.CSSProperties}
              >
                {complete ? '⭐' : unlocked ? '📖' : '🔒'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
