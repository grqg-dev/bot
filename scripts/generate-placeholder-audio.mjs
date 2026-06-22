#!/usr/bin/env node
/**
 * Generates placeholder MP3 clips for all required audio keys.
 * Uses ffmpeg to synthesize short tones — replace with real recordings later.
 */
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const audioDir = join(__dirname, '..', 'public', 'audio');

const LESSONS = [
  { newSounds: ['s', 'a', 't', 'p'], reviewSounds: [], targetWords: ['at', 'sat', 'pat', 'tap'], sightWords: ['I'] },
  { newSounds: ['i', 'n'], reviewSounds: ['s', 'a', 't', 'p'], targetWords: ['sit', 'tin', 'nip', 'pin', 'tap'], sightWords: ['a'] },
  { newSounds: ['m', 'd'], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n'], targetWords: ['mat', 'man', 'mad', 'dad', 'dip', 'sad'], sightWords: ['the'] },
  { newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'], targetWords: ['map', 'nap', 'sip', 'dim', 'pad'], sightWords: ['to', 'see'] },
  { newSounds: ['g', 'o'], reviewSounds: ['s', 'a', 't', 'i', 'n', 'm', 'd', 'p'], targetWords: ['got', 'dog', 'dot', 'top', 'pot', 'gas'], sightWords: ['go'] },
  { newSounds: ['c', 'k'], reviewSounds: ['a', 't', 'i', 'n', 'o', 'g', 'd', 'p'], targetWords: ['cat', 'can', 'cot', 'kit', 'kid', 'cap'], sightWords: ['my'] },
  { newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k'], targetWords: ['dog', 'cat', 'pig', 'sock', 'tap', 'man'], sightWords: ['and'] },
  { newSounds: ['e', 'u'], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k'], targetWords: ['pet', 'net', 'bed', 'cup', 'mud', 'sun'], sightWords: ['is'] },
  { newSounds: ['r', 'h'], reviewSounds: ['a', 'e', 'i', 'o', 'u', 't', 'p', 'n', 'm', 'd', 'c', 'g'], targetWords: ['run', 'rat', 'red', 'hat', 'hot', 'hen'], sightWords: ['it'] },
  { newSounds: ['b', 'f', 'l'], reviewSounds: ['a', 'e', 'i', 'o', 'u', 'r', 'h', 't', 'n', 'm', 'd'], targetWords: ['bat', 'bus', 'fan', 'fun', 'log', 'lip'], sightWords: ['up', 'we'] },
  { newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'], targetWords: ['fish', 'dog', 'sun', 'cat', 'bed', 'run'], sightWords: ['look', 'here'] },
  { newSounds: [], reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'], targetWords: ['cat', 'sat', 'mat', 'dog', 'ran'], sightWords: ['the', 'a', 'I', 'can', 'see'] },
];

function getKeys() {
  const keys = new Set();
  for (const lesson of LESSONS) {
    for (const s of [...lesson.newSounds, ...lesson.reviewSounds]) {
      keys.add(`sound_${s}`);
    }
    for (const w of lesson.targetWords) {
      keys.add(`word_${w}`);
      keys.add(`blend_${w}`);
      for (const ch of w) keys.add(`sound_${ch}`);
    }
    for (const w of lesson.sightWords) {
      keys.add(`sight_${w}`);
    }
  }
  return [...keys].sort();
}

function freqForKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 1000;
  return 220 + (hash % 500);
}

function generateMp3(key, outPath) {
  const freq = freqForKey(key);
  const duration = key.startsWith('blend_') ? 1.2 : key.startsWith('word_') || key.startsWith('sight_') ? 0.6 : 0.35;
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=${freq}:duration=${duration}" -ar 44100 -ac 1 -b:a 64k "${outPath}"`,
    { stdio: 'pipe' },
  );
}

mkdirSync(audioDir, { recursive: true });

const keys = getKeys();
let created = 0;
let skipped = 0;

for (const key of keys) {
  const outPath = join(audioDir, `${key}.mp3`);
  if (existsSync(outPath)) {
    skipped++;
    continue;
  }
  try {
    generateMp3(key, outPath);
    created++;
  } catch (e) {
    console.error(`Failed to generate ${key}:`, e.message);
  }
}

console.log(`Audio: ${created} created, ${skipped} skipped, ${keys.length} total keys`);
