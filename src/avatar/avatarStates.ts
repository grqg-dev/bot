import type { AvatarState } from '../curriculum/types';

export const AVATAR_STATES: AvatarState[] = [
  'idle',
  'talking',
  'celebrate',
  'encourage',
  'thinking',
];

export const AVATAR_STATE_LABELS: Record<AvatarState, string> = {
  idle: 'Idle',
  talking: 'Talking',
  celebrate: 'Celebrate',
  encourage: 'Encourage',
  thinking: 'Thinking',
};
