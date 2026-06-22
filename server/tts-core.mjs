/**
 * Shared TTS synthesis — used by dev server, Lambda, and generate-all-audio.
 * Supports AWS Polly (default) with optional ElevenLabs via TTS_PROVIDER env.
 */

import { speechForClipKey } from './clip-speech.mjs';

export { speechForClipKey, textForClipKey } from './clip-speech.mjs';

export async function synthesizeSpeech(input, options = {}) {
  const provider = options.provider ?? process.env.TTS_PROVIDER ?? 'polly';
  const voiceId = options.voiceId ?? process.env.POLLY_VOICE_ID ?? 'Joanna';
  const engine = options.engine ?? process.env.POLLY_ENGINE ?? 'neural';
  const textType = options.textType ?? 'text';

  const text = typeof input === 'string' ? input : input.text;
  const resolvedTextType = typeof input === 'object' && input.textType ? input.textType : textType;

  if (provider === 'elevenlabs') {
    return synthesizeElevenLabs(stripSsml(text), options);
  }
  return synthesizePolly(text, { voiceId, engine, textType: resolvedTextType });
}

/** Generate MP3 for a manifest clip key (sound_*, word_*, sight_*, blend_*). */
export async function synthesizeClipKey(key, options = {}) {
  const speech = speechForClipKey(key);
  return synthesizeSpeech(speech, options);
}

function stripSsml(ssml) {
  return ssml
    .replace(/<speak>/gi, '')
    .replace(/<\/speak>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function synthesizePolly(text, { voiceId, engine, textType }) {
  const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly');
  const client = new PollyClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  const result = await client.send(
    new SynthesizeSpeechCommand({
      Text: text,
      TextType: textType === 'ssml' ? 'ssml' : 'text',
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: engine,
    }),
  );

  const bytes = await result.AudioStream.transformToByteArray();
  return Buffer.from(bytes);
}

async function synthesizeElevenLabs(text, options) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = options.elevenLabsVoiceId ?? process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    throw new Error('ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID required for ElevenLabs provider');
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export function ttsResponseHeaders() {
  return {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };
}

export async function handleTtsRequest(body) {
  const text = body?.text;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    const err = new Error('Missing or empty "text" field');
    err.statusCode = 400;
    throw err;
  }
  if (text.length > 2000) {
    const err = new Error('Text too long (max 2000 chars)');
    err.statusCode = 400;
    throw err;
  }

  const audio = await synthesizeSpeech(
    {
      text: text.trim(),
      textType: body.textType ?? (text.trim().startsWith('<speak>') ? 'ssml' : 'text'),
    },
    {
      provider: body.provider,
      voiceId: body.voiceId,
      engine: body.engine,
      elevenLabsVoiceId: body.elevenLabsVoiceId,
    },
  );

  return audio;
}
