import { useStore } from '../store';
import { ActivityHost } from '../activities/ActivityHost';
import { RobotScene } from '../avatar/RobotScene';
import { BigButton } from '../ui/BigButton';
import './LessonRunner.css';

export function LessonRunner() {
  const lessonSession = useStore((s) => s.lessonSession);
  const setScreen = useStore((s) => s.setScreen);
  const setParentGateTarget = useStore((s) => s.setParentGateTarget);

  if (!lessonSession) return null;

  const { activities, currentIndex } = lessonSession;
  const activity = activities[currentIndex];

  return (
    <div className="lesson-runner">
      <div className="lesson-runner__robot">
        <RobotScene />
      </div>
      <div className="lesson-runner__activity">
        <BigButton
          className="lesson-runner__pause"
          onPress={() => {
            setParentGateTarget('pause');
            setScreen('parent_gate');
          }}
          ariaLabel="Pause lesson"
        >
          ⏸️
        </BigButton>
        {activity && (
          <ActivityHost
            activity={activity}
            index={currentIndex}
            total={activities.length}
          />
        )}
      </div>
    </div>
  );
}
