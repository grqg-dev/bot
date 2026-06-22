#!/usr/bin/env node
/**
 * Local dev TTS API — POST /api/tts { "text": "..." } → audio/mpeg
 * Run: npm run dev:tts
 */
import http from 'http';
import { handleTtsRequest, ttsResponseHeaders } from './tts-core.mjs';

const PORT = Number(process.env.TTS_PORT ?? 3001);

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, provider: process.env.TTS_PROVIDER ?? 'polly' }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/tts') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const audio = await handleTtsRequest(parsed);
      res.writeHead(200, ttsResponseHeaders());
      res.end(audio);
    } catch (err) {
      const status = err.statusCode ?? 500;
      console.error('[dev-tts]', err.message);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: err.message,
        hint: status === 500
          ? 'Set AWS credentials for Polly, or TTS_PROVIDER=elevenlabs with ELEVENLABS_API_KEY'
          : undefined,
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[dev-tts] Listening on http://localhost:${PORT}/api/tts`);
  console.log(`[dev-tts] Provider: ${process.env.TTS_PROVIDER ?? 'polly (AWS)'}`);
});
