#!/usr/bin/env node
/**
 * Generate ALL curriculum audio clips via TTS (no human recording).
 *
 * Uses AWS Polly with SSML + IPA phonemes for letter sounds, plain speech for
 * words, slow-then-fast blends. Writes MP3s to public/audio/<key>.mp3.
 *
 * Setup:
 *   cp .env.example .env
 *   # Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (or use AWS CLI profile)
 *
 * Run:
 *   npm run generate-audio          # skip existing files
 *   npm run generate-audio -- --force   # regenerate everything
 *   npm run generate-audio -- --dry-run # list keys only
 *
 * ElevenLabs (optional):
 *   TTS_PROVIDER=elevenlabs ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... npm run generate-audio
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getRequiredClipKeys } from './lib/lessons.mjs';
import { synthesizeClipKey } from '../server/tts-core.mjs';
import { speechForClipKey } from '../server/clip-speech.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const audioDir = join(root, 'public', 'audio');

// Load .env if present (no extra dependency)
try {
  const envPath = join(root, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // ignore
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');
const delayMs = Number(process.env.TTS_DELAY_MS ?? 120);

const keys = getRequiredClipKeys();
const provider = process.env.TTS_PROVIDER ?? 'polly';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkCredentials() {
  if (provider === 'elevenlabs') {
    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
      console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID');
      console.error('Set them in .env or use AWS Polly (default).');
      process.exit(1);
    }
    return;
  }
  const hasEnvCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  const hasProfile = process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE;
  if (!hasEnvCreds && !hasProfile) {
    console.warn('No AWS credentials in .env — will try default credential chain (AWS CLI profile, IAM role, etc.)');
  }
}

async function main() {
  console.log('Reading Buddy — generate all audio clips via TTS\n');
  console.log(`Provider: ${provider}`);
  console.log(`Keys:     ${keys.length}`);
  console.log(`Output:   ${audioDir}\n`);

  if (dryRun) {
    for (const key of keys) {
      const { text, textType } = speechForClipKey(key);
      const preview = textType === 'ssml' ? text.replace(/\s+/g, ' ').slice(0, 80) + '…' : text;
      console.log(`${key}.mp3  [${textType}]  ${preview}`);
    }
    return;
  }

  checkCredentials();
  mkdirSync(audioDir, { recursive: true });

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const outPath = join(audioDir, `${key}.mp3`);

    if (existsSync(outPath) && !force) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${keys.length}] ${key} … `);

    try {
      const audio = await synthesizeClipKey(key);
      writeFileSync(outPath, audio);
      created++;
      console.log('ok');
    } catch (err) {
      failed++;
      failures.push({ key, error: err.message });
      console.log(`FAIL — ${err.message}`);
    }

    if (delayMs > 0 && i < keys.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${failed} failed`);

  if (failures.length > 0) {
    console.error('\nFailures:');
    for (const f of failures) console.error(`  ${f.key}: ${f.error}`);
    console.error('\nSetup help:');
    console.error('  1. cp .env.example .env');
    console.error('  2. Add AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY');
    console.error('  3. npm run generate-audio -- --force');
    process.exit(1);
  }

  console.log('\nAll clips ready. Run: npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
