export const WORD_EMOJI: Record<string, string> = {
  at: '👆',
  sat: '🪑',
  pat: '👋',
  tap: '💧',
  sit: '🪑',
  tin: '🥫',
  nip: '✂️',
  pin: '📌',
  mat: '🧘',
  man: '👨',
  mad: '😠',
  dad: '👨',
  dip: '🥣',
  sad: '😢',
  map: '🗺️',
  nap: '😴',
  sip: '🥤',
  dim: '💡',
  pad: '📝',
  got: '✅',
  dog: '🐕',
  dot: '⚫',
  top: '🔝',
  pot: '🍲',
  gas: '⛽',
  cat: '🐱',
  can: '🥫',
  cot: '🛏️',
  kit: '🧰',
  kid: '👧',
  cap: '🧢',
  pig: '🐷',
  sock: '🧦',
  pet: '🐾',
  net: '🥅',
  bed: '🛏️',
  cup: '☕',
  mud: '🟤',
  sun: '☀️',
  run: '🏃',
  rat: '🐀',
  red: '🔴',
  hat: '🎩',
  hot: '🔥',
  hen: '🐔',
  bat: '🦇',
  bus: '🚌',
  fan: '🪭',
  fun: '🎉',
  log: '🪵',
  lip: '👄',
  fish: '🐟',
  look: '👀',
  here: '📍',
  ran: '🏃',
};

export function wordEmoji(word: string): string {
  return WORD_EMOJI[word] ?? '❓';
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
