import { useCallback, useState } from 'react';
import type { Activity } from '../curriculum/types';
import { ListenSound } from './ListenSound';
import { PickSound } from './PickSound';
import { Trace } from './Trace';
import { Blend } from './Blend';
import { BuildWord } from './BuildWord';
import { SightWord } from './SightWord';
import { ReviewGame } from './ReviewGame';
import { useStore } from '../store';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { StarBurst } from '../ui/StarBurst';
import './ActivityHost.css';

interface ActivityHostProps {
  activity: Activity;
  index: number;
  total: number;
}

export function ActivityHost({ activity, index, total }: ActivityHostProps) {
  const completeActivity = useStore((s) => s.completeActivity);
  const setAvatarState = useStore((s) => s.setAvatarState);
  const robotName = useStore((s) => s.robotName);
  const [celebrating, setCelebrating] = useState(false);

  const handleSuccess = useCallback(() => {
    setCelebrating(true);
    setAvatarState('celebrate');
    audioService.speakText(`${robotName} says ${INSTRUCTIONS.greatJob}`);

    setTimeout(() => {
      setCelebrating(false);
      setAvatarState('idle');
      completeActivity();
    }, 1800);
  }, [completeActivity, robotName, setAvatarState]);

  const renderActivity = () => {
    switch (activity.type) {
      case 'LISTEN_SOUND':
        return <ListenSound sound={activity.sound!} onSuccess={handleSuccess} />;
      case 'PICK_SOUND':
        return (
          <PickSound
            sound={activity.sound!}
            choices={activity.choices!}
            onSuccess={handleSuccess}
          />
        );
      case 'TRACE':
        return <Trace sound={activity.sound!} onSuccess={handleSuccess} />;
      case 'BLEND':
        return (
          <Blend
            word={activity.word!}
            wholeWordClipOnly={activity.wholeWordClipOnly}
            onSuccess={handleSuccess}
          />
        );
      case 'BUILD_WORD':
        return (
          <BuildWord
            word={activity.word!}
            tiles={activity.tiles!}
            onSuccess={handleSuccess}
          />
        );
      case 'SIGHT_WORD':
        return <SightWord sightWord={activity.sightWord!} onSuccess={handleSuccess} />;
      case 'REVIEW_GAME':
        return <ReviewGame reviewPool={activity.reviewPool!} onSuccess={handleSuccess} />;
      default:
        return null;
    }
  };

  return (
    <div className="activity-host">
      <div className="activity-host__dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`activity-host__dot ${i < index ? 'activity-host__dot--done' : ''} ${i === index ? 'activity-host__dot--current' : ''}`}
          />
        ))}
      </div>
      <div className="activity-host__content">{renderActivity()}</div>
      <StarBurst active={celebrating} />
    </div>
  );
}
