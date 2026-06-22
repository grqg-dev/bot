#!/usr/bin/env node
/**
 * Verify all manifest clip files exist in public/audio/.
 * Exit 1 if any are missing.
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getRequiredClipKeys } from './lib/lessons.mjs';

const audioDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const keys = getRequiredClipKeys();
const missing = keys.filter((k) => !existsSync(join(audioDir, `${k}.mp3`)));

if (missing.length === 0) {
  console.log(`OK — all ${keys.length} audio clips present in public/audio/`);
  process.exit(0);
}

console.error(`Missing ${missing.length} / ${keys.length} clips:`);
for (const k of missing) console.error(`  ${k}.mp3`);
console.error('\nRun: npm run generate-audio');
process.exit(1);
