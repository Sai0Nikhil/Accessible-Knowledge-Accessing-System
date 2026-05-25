// translate.js — free translation via MyMemory API.
// No API key needed. CORS-enabled, callable directly from the browser.
// Limits: ~5 000 chars/day per IP (50 000 with an email in `de` param).
// Each request: max ~500 bytes.

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

/** Supported target languages (common subset). */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
];

/**
 * Translate a single block of text.
 * @param {string} text   — text to translate
 * @param {string} target — target language code (e.g. 'es')
 * @param {string} source — source language code (default 'en')
 * @returns {Promise<string>} translated text
 */
export async function translateText(text, target, source = 'en') {
  if (!text || !target || target === source) return text;
  // MyMemory has a ~500 byte limit per request; if the text is too long,
  // we split into sentences / paragraphs and translate each separately.
  const maxBytes = 450; // leave room for URL encoding overhead
  const encoder = new TextEncoder();
  const segments = [];

  // Split by sentence boundaries first
  const raw = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

  let current = '';
  for (const seg of raw) {
    const combined = current ? current + ' ' + seg : seg;
    if (encoder.encode(combined).length > maxBytes && current) {
      segments.push(current);
      current = seg;
    } else {
      current = combined;
    }
  }
  if (current) segments.push(current);

  // Translate each segment and join
  const results = await Promise.all(
    segments.map(async (seg) => {
      const params = new URLSearchParams({
        q: seg.slice(0, 500),
        langpair: `${source}|${target}`,
      });
      // Adding a dummy email greatly increases the rate limit
      params.set('de', 'student@stemportal.local');

      try {
        const res = await fetch(`${MYMEMORY_URL}?${params}`);
        const data = await res.json();
        return data?.responseData?.translatedText || seg;
      } catch {
        return seg; // fallback to original on error
      }
    })
  );

  return results.join(' ');
}
