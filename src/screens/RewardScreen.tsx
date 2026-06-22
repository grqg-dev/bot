import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { ROBOT_PARTS } from '../reward/robotParts';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { RobotScene } from '../avatar/RobotScene';
import { BigButton } from '../ui/BigButton';
import { StarBurst } from '../ui/StarBurst';
import './RewardScreen.css';

export function RewardScreen() {
  const lessonSession = useStore((s) => s.lessonSession);
  const progress = useStore((s) => s.progress);
  const finishLesson = useStore((s) => s.finishLesson);
  const equipPart = useStore((s) => s.equipPart);
  const [showBurst, setShowBurst] = useState(true);

  const starsEarned = lessonSession?.starsEarnedThisLesson ?? 0;
  const newParts = lessonSession?.newlyUnlockedParts ?? [];

  useEffect(() => {
    audioService.speakText(INSTRUCTIONS.lessonComplete);
    const t = setTimeout(() => setShowBurst(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const unlockedParts = ROBOT_PARTS.filter((p) =>
    progress.unlockedPartIds.includes(p.id),
  );

  return (
    <div className="reward-screen">
      <StarBurst active={showBurst} count={8} />

      <div className="reward-screen__robot">
        <RobotScene />
      </div>

      <div className="reward-screen__panel">
        <div className="reward-screen__stars">
          ⭐ +{starsEarned}
        </div>

        {newParts.length > 0 && (
          <div className="reward-screen__new-parts">
            <p className="reward-screen__label parent-only">New parts!</p>
            {newParts.map((id) => {
              const part = ROBOT_PARTS.find((p) => p.id === id);
              if (!part) return null;
              return (
                <BigButton
                  key={id}
                  className="reward-screen__part-btn reward-screen__part-btn--new"
                  onPress={() => equipPart(id)}
                  ariaLabel={`Equip ${part.slot}`}
                >
                  ✨
                </BigButton>
              );
            })}
          </div>
        )}

        <div className="reward-screen__parts">
          {unlockedParts.map((part) => {
            const equipped = progress.equipped[part.slot] === part.id;
            return (
              <BigButton
                key={part.id}
                className={`reward-screen__part-btn ${equipped ? 'reward-screen__part-btn--equipped' : ''}`}
                onPress={() => equipPart(part.id)}
                ariaLabel={`${part.slot} ${part.id}`}
              >
                {part.slot === 'color' ? '🎨' : part.slot === 'antenna' ? '📡' : part.slot === 'eyes' ? '👀' : '⭐'}
              </BigButton>
            );
          })}
        </div>

        <div className="reward-screen__actions">
          <BigButton onPress={finishLesson} ariaLabel="Play more">
            ▶️
          </BigButton>
          <BigButton
            onPress={finishLesson}
            ariaLabel="All done"
          >
            🏠
          </BigButton>
        </div>
      </div>
    </div>
  );
}
