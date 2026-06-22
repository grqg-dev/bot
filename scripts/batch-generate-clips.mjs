#!/usr/bin/env node
/** @deprecated Use generate-all-audio.mjs — this script forwards for compatibility. */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const script = join(dirname(fileURLToPath(import.meta.url)), 'generate-all-audio.mjs');
const child = spawn('node', [script, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
