# Reading Buddy TTS Lambda

POST `{ "text": "Great job!" }` → `audio/mpeg`

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_PROVIDER` | `polly` | `polly` or `elevenlabs` |
| `AWS_REGION` | `us-east-1` | Polly region |
| `POLLY_VOICE_ID` | `Joanna` | Polly voice |
| `POLLY_ENGINE` | `neural` | `neural` or `standard` |
| `ELEVENLABS_API_KEY` | — | Required for ElevenLabs |
| `ELEVENLABS_VOICE_ID` | — | Required for ElevenLabs |

## IAM policy (Polly)

```json
{
  "Effect": "Allow",
  "Action": "polly:SynthesizeSpeech",
  "Resource": "*"
}
```

## Deploy (manual zip)

```bash
cd lambda/tts
npm install
cp -r ../../server ./server
zip -r function.zip handler.mjs server node_modules package.json
# Upload function.zip to Lambda; set handler to handler.handler
```

## API Gateway

- Route: `POST /api/tts`
- Integration: Lambda proxy
- CORS: allow origin `*` (or your PWA domain)

Point the PWA Settings → Remote TTS URL at your API Gateway URL + `/api/tts`.
