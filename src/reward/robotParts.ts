export interface RobotPart {
  id: string;
  slot: 'antenna' | 'color' | 'eyes' | 'sticker';
  costStars: number;
}

export const ROBOT_PARTS: RobotPart[] = [
  { id: 'c1', slot: 'color', costStars: 0 },
  { id: 'c2', slot: 'color', costStars: 6 },
  { id: 'c3', slot: 'color', costStars: 14 },
  { id: 'a1', slot: 'antenna', costStars: 0 },
  { id: 'a2', slot: 'antenna', costStars: 10 },
  { id: 'eyes1', slot: 'eyes', costStars: 0 },
  { id: 'eyes2', slot: 'eyes', costStars: 18 },
  { id: 'st1', slot: 'sticker', costStars: 8 },
  { id: 'st2', slot: 'sticker', costStars: 22 },
];

export function getDefaultEquipped(): Record<string, string> {
  return {
    color: 'c1',
    antenna: 'a1',
    eyes: 'eyes1',
  };
}

export function computeUnlockedParts(stars: number): string[] {
  return ROBOT_PARTS.filter((p) => stars >= p.costStars).map((p) => p.id);
}
