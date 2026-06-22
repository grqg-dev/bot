/**
 * Maps audio manifest keys → TTS input (SSML with IPA phonemes for letter sounds).
 * Used by generate-all-audio.mjs and the dev TTS server.
 */

/** IPA phonemes for synthetic phonics (short vowels, consonants). */
export const PHONEME_IPA = {
  s: 's',
  a: 'æ',
  t: 't',
  p: 'p',
  i: 'ɪ',
  n: 'n',
  m: 'm',
  d: 'd',
  g: 'g',
  o: 'ɒ',
  c: 'k',
  k: 'k',
  e: 'ɛ',
  u: 'ʌ',
  r: 'ɹ',
  h: 'h',
  b: 'b',
  f: 'f',
  l: 'l',
};

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Single isolated phoneme — SSML with IPA, stretched slightly for clarity. */
export function ssmlForPhoneme(grapheme) {
  const ipa = PHONEME_IPA[grapheme];
  if (!ipa) {
    return `<speak><say-as interpret-as="characters">${escapeXml(grapheme)}</say-as></speak>`;
  }
  return `<speak><prosody rate="85%"><phoneme alphabet="ipa" ph="${ipa}">${escapeXml(grapheme)}</phoneme></prosody></speak>`;
}

/** Whole word spoken normally. */
export function textForWord(word) {
  return word;
}

/** Sight word — slightly slower and clear. */
export function ssmlForSightWord(word) {
  return `<speak><prosody rate="90%">${escapeXml(word)}</prosody></speak>`;
}

/**
 * Blend clip: each letter sound slowly, pause, then whole word.
 * Uses IPA per grapheme; whole word at the end is plain speech.
 */
export function ssmlForBlend(word) {
  const parts = [...word].map((ch) => {
    const ipa = PHONEME_IPA[ch];
    if (!ipa) {
      return `<prosody rate="75%">${escapeXml(ch)}</prosody><break time="350ms"/>`;
    }
    return `<prosody rate="75%"><phoneme alphabet="ipa" ph="${ipa}">${escapeXml(ch)}</phoneme></prosody><break time="350ms"/>`;
  });
  return `<speak>${parts.join('')}<break time="500ms"/><emphasis level="moderate">${escapeXml(word)}</emphasis></speak>`;
}

/**
 * @param {string} key - manifest key e.g. sound_s, word_sat, sight_the, blend_sat
 * @returns {{ text: string, textType: 'text' | 'ssml' }}
 */
export function speechForClipKey(key) {
  if (key.startsWith('sound_')) {
    const grapheme = key.slice('sound_'.length);
    return { text: ssmlForPhoneme(grapheme), textType: 'ssml' };
  }
  if (key.startsWith('word_')) {
    return { text: textForWord(key.slice('word_'.length)), textType: 'text' };
  }
  if (key.startsWith('sight_')) {
    const word = key.slice('sight_'.length);
    return { text: ssmlForSightWord(word), textType: 'ssml' };
  }
  if (key.startsWith('blend_')) {
    const word = key.slice('blend_'.length);
    return { text: ssmlForBlend(word), textType: 'ssml' };
  }
  return { text: key, textType: 'text' };
}

/** @deprecated use speechForClipKey */
export function textForClipKey(key) {
  const { text } = speechForClipKey(key);
  return text;
}
