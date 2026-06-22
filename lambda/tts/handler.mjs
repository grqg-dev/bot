/**
 * AWS Lambda handler for Reading Buddy TTS.
 *
 * API Gateway HTTP API route: POST /api/tts
 * Body: { "text": "Great job!" }
 * Returns: audio/mpeg
 *
 * Deploy with SAM/CDK or zip upload. Required IAM: polly:SynthesizeSpeech
 */
import { handleTtsRequest, ttsResponseHeaders } from '../../server/tts-core.mjs';

export async function handler(event) {
  const method = event.requestContext?.http?.method ?? event.httpMethod;

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (method !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
    const audio = await handleTtsRequest(body);

    return {
      statusCode: 200,
      headers: ttsResponseHeaders(),
      isBase64Encoded: true,
      body: audio.toString('base64'),
    };
  } catch (err) {
    const status = err.statusCode ?? 500;
    return {
      statusCode: status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
