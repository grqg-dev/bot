#!/usr/bin/env node
/**
 * Batch-generate curriculum audio clips via TTS API (Polly/ElevenLabs).
 *
 * Requires dev TTS server or Lambda URL:
 *   TTS_API_URL=http://localhost:3001/api/tts npm run generate-audio:tts
 *
 * Uses phoneme approximations for sound_* keys — replace with human recordings for production.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { textForClipKey } from '../server/tts-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const audioDir = join(__dirname, '..', 'public', 'audio');
const apiUrl = process.env.TTS_API_URL ?? 'http://localhost:3001/api/tts';
const force = process.argv.includes('--force');

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
    for (const s of [...lesson.newSounds, ...lesson.reviewSounds]) keys.add(`sound_${s}`);
    for (const w of lesson.targetWords) {
      keys.add(`word_${w}`);
      keys.add(`blend_${w}`);
      for (const ch of w) keys.add(`sound_${ch}`);
    }
    for (const w of lesson.sightWords) keys.add(`sight_${w}`);
  }
  return [...keys].sort();
}

async function synthesize(text) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`TTS API ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

mkdirSync(audioDir, { recursive: true });

const keys = getKeys();
let created = 0;
let skipped = 0;
let failed = 0;

console.log(`Generating ${keys.length} clips via ${apiUrl}`);

for (const key of keys) {
  const outPath = join(audioDir, `${key}.mp3`);
  if (existsSync(outPath) && !force) {
    skipped++;
    continue;
  }

  const text = textForClipKey(key);
  try {
    const audio = await synthesize(text);
    writeFileSync(outPath, audio);
    created++;
    if (created % 10 === 0) console.log(`  ${created} done…`);
  } catch (err) {
    console.error(`  FAIL ${key}: ${err.message}`);
    failed++;
    if (failed === 1) {
      console.error('\nTip: start TTS server first — npm run dev:tts');
      console.error('     and set AWS credentials for Polly.\n');
    }
  }
}

console.log(`Done: ${created} created, ${skipped} skipped, ${failed} failed`);
if (failed > 0) process.exit(1);
