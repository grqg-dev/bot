/**
 * Shared TTS synthesis — used by dev server and AWS Lambda.
 * Supports AWS Polly (default) with optional ElevenLabs via TTS_PROVIDER env.
 */

const PHONEME_SPEAK = {
  s: 'ssss', a: 'aaa', t: 'tuh', p: 'puh', i: 'ih', n: 'nnn', m: 'mmm', d: 'duh',
  g: 'guh', o: 'ah', c: 'kuh', k: 'kuh', e: 'eh', u: 'uh', r: 'rrr', h: 'huh',
  b: 'buh', f: 'fff', l: 'lll',
};

export function textForClipKey(key) {
  if (key.startsWith('sound_')) {
    const phoneme = key.slice('sound_'.length);
    return PHONEME_SPEAK[phoneme] ?? phoneme;
  }
  if (key.startsWith('word_')) return key.slice('word_'.length);
  if (key.startsWith('sight_')) return key.slice('sight_'.length);
  if (key.startsWith('blend_')) {
    const word = key.slice('blend_'.length);
    return [...word].join(' ... ') + ' ... ' + word;
  }
  return key;
}

export async function synthesizeSpeech(text, options = {}) {
  const provider = options.provider ?? process.env.TTS_PROVIDER ?? 'polly';
  const voiceId = options.voiceId ?? process.env.POLLY_VOICE_ID ?? 'Joanna';
  const engine = options.engine ?? process.env.POLLY_ENGINE ?? 'neural';

  if (provider === 'elevenlabs') {
    return synthesizeElevenLabs(text, options);
  }
  return synthesizePolly(text, { voiceId, engine });
}

async function synthesizePolly(text, { voiceId, engine }) {
  const { PollyClient, SynthesizeSpeechCommand } = await import('@aws-sdk/client-polly');
  const client = new PollyClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  const result = await client.send(
    new SynthesizeSpeechCommand({
      Text: text,
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
  if (text.length > 500) {
    const err = new Error('Text too long (max 500 chars)');
    err.statusCode = 400;
    throw err;
  }

  const audio = await synthesizeSpeech(text.trim(), {
    provider: body.provider,
    voiceId: body.voiceId,
    engine: body.engine,
    elevenLabsVoiceId: body.elevenLabsVoiceId,
  });

  return audio;
}
