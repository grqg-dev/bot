#!/usr/bin/env node
/**
 * Starts dev TTS server + Vite dev server together.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const tts = spawn('node', ['server/dev-tts-server.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const vite = spawn('npx', ['vite'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const shutdown = () => {
  tts.kill();
  vite.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

tts.on('exit', (code) => {
  if (code !== 0 && code !== null) shutdown();
});

vite.on('exit', (code) => {
  process.exit(code ?? 0);
});

console.log('[dev:all] TTS API + Vite starting…');
