# Reading Buddy

A phonics learning PWA for young readers on iPad. Teaches sound-out-and-blend phonics plus sight words through audio-first, icon-driven activities with a friendly procedural 3D robot companion.

## Quick start

```bash
npm install
npm run generate-audio   # placeholder tone clips (replace with real recordings)
npm run dev              # http://localhost:5173
```

## Build & preview

```bash
npm run build
npm run preview
```

Install as PWA: open in Safari on iPad → Share → Add to Home Screen. Use landscape orientation.

## Project structure

- `src/curriculum/` — lesson data, activity builder, audio manifest
- `src/activities/` — ListenSound, PickSound, Trace, Blend, BuildWord, SightWord, ReviewGame
- `src/avatar/` — procedural Three.js robot with canvas face expressions
- `src/audio/` — clip playback + Web Speech TTS (instructions/praise only)
- `src/screens/` — HomeMap, LessonRunner, RewardScreen, ParentGate, Settings
- `public/audio/` — pre-made MP3 clips (`sound_*`, `word_*`, `sight_*`, `blend_*`)

## Audio

Letter sounds and words **must** use pre-recorded clips — never speech synthesis for phonemes or curriculum words. Dynamic TTS is only for full-sentence instructions and praise.

Generate placeholder clips:

```bash
npm run generate-audio
```

Replace files in `public/audio/` with real recordings. Run the dev build to see `console.warn` for any missing keys.

## Phases (build spec)

| Phase | Status | What's included |
|-------|--------|-----------------|
| 0 | Done | Vite/React/TS, PWA, Robot, AudioService, dev expression controls |
| 1 | Done | buildActivities, Listen/Pick/Blend, L01–L02, stars, localStorage |
| 2 | Done | Trace, BuildWord, SightWord, ReviewGame, HomeMap, robot parts |
| 3 | Done | Full audio manifest, ParentGate, Settings, polish |
| 4 | Later | Remote TTS backend (AWS Polly / ElevenLabs) |

## Verify

1. **Boot** — tap start, robot says hello, audio unlocks
2. **L01** — complete all activities, earn stars, see reward screen
3. **Reload** — progress persists (`localStorage` key `reading_buddy_progress_v1`)
4. **Parent gate** — hold 3s + math question opens Settings
5. **Robot parts** — stars unlock parts; equipping changes robot appearance

## Tech stack

Vite, React, TypeScript, Three.js (@react-three/fiber, @react-three/drei), Zustand, vite-plugin-pwa, plain CSS.
