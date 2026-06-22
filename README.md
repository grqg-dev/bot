# Reading Buddy

A phonics learning PWA for a 4.5-year-old on iPad Safari. Audio-first, icon-driven activities with a procedural 3D robot companion. Teaches synthetic phonics (sound out + blend) and Dolch pre-primer sight words across 12 lessons.

**For coding agents:** see [`agents.md`](agents.md) for architecture, rules, and next steps.

---

## Quick start

```bash
npm install
cp .env.example .env          # add AWS credentials
npm run generate-audio        # TTS-generate all 140 clips
npm run verify-audio          # confirm clips exist
npm run dev                   # http://localhost:5173
```

On iPad: open in Safari → Share → **Add to Home Screen** (landscape, fullscreen PWA).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run dev:all` | Vite + local TTS API (for remote instruction voice) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run generate-audio` | Generate missing curriculum clips via AWS Polly |
| `npm run generate-audio:force` | Regenerate all 140 clips |
| `npm run generate-audio:dry-run` | Preview clip keys + SSML without calling AWS |
| `npm run generate-audio:placeholder` | ffmpeg sine-tone placeholders (CI only) |
| `npm run verify-audio` | Exit 1 if any manifest clip is missing |
| `npm run validate-curriculum` | Validate `buildActivities()` for all 12 lessons |

---

## Audio

All curriculum audio lives in `public/audio/` as pre-generated MP3 files. **The app never uses speech synthesis for letter sounds or words at runtime.**

| Clip type | Filename | Generated as |
|-----------|----------|--------------|
| Letter sound | `sound_s.mp3` | SSML IPA phoneme `/s/` |
| Word | `word_sat.mp3` | Plain speech "sat" |
| Sight word | `sight_the.mp3` | Slightly slower speech |
| Blend | `blend_sat.mp3` | Slow phonemes + whole word |

```bash
cp .env.example .env
# AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY  (or AWS_PROFILE)

npm run generate-audio
```

Optional ElevenLabs: set `TTS_PROVIDER=elevenlabs` in `.env`.

**Instructions/praise** ("Great job!", "Tap the letter…") use Web Speech by default, or remote TTS via Settings (parent gate).

---

## Project layout

```
src/
  curriculum/       lessons.ts, buildActivities.ts, audioManifest.ts
  activities/       7 activity components + ActivityHost
  avatar/           procedural Three.js robot + canvas face
  audio/            AudioService (clips + TTS)
  screens/          HomeMap, LessonRunner, RewardScreen, ParentGate, Settings
  store.ts          zustand — progress, navigation, robot state
public/audio/       140 MP3 clips (generated, committed)
scripts/            generate-all-audio.mjs, verify-audio.mjs, …
server/             TTS core + clip-speech SSML mapping
lambda/tts/         AWS Lambda handler for remote instruction TTS
```

---

## Verify the app

1. **Boot** — tap ▶️, audio unlocks, HomeMap loads
2. **L01** — complete 7 activities, earn stars, reward screen
3. **Reload** — progress persists (`reading_buddy_progress_v1` in localStorage)
4. **Parent gate** — ⚙️ → hold 3s + math → Settings
5. **Robot parts** — stars unlock parts; equipping changes the live robot
6. **Audio** — `npm run verify-audio` passes; no missing-clip warnings in dev console

---

## Deploy

```bash
npm run generate-audio   # ensure clips exist
npm run build            # output in dist/
```

Host `dist/` on any static host (S3 + CloudFront, Netlify, etc.). PWA service worker precaches JS/CSS/HTML/icons/MP3s.

Remote instruction TTS (optional): deploy `lambda/tts/` — see [`lambda/tts/README.md`](lambda/tts/README.md).

---

## Tech stack

Vite · React 19 · TypeScript · Three.js (`@react-three/fiber`, `@react-three/drei`) · Zustand · vite-plugin-pwa · plain CSS

No Redux, Tailwind, backend database, or external 3D assets.

---

## Build phases

| Phase | Status |
|-------|--------|
| 0 — Scaffold + Robot | ✅ |
| 1 — Core loop (3 activities, L01–L02) | ✅ |
| 2 — Full curriculum + map + robot parts | ✅ |
| 3 — Parent gate + polish | ✅ |
| 4 — Remote TTS + clip generation | ✅ |

See [`agents.md`](agents.md) for remaining work and agent guidelines.
